import { WEBGL } from "three/examples/jsm/WebGL.js";
import { Viewer } from "./viewer.js";
import { SimpleDropzone } from "simple-dropzone";

if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
  console.error("The File APIs are not fully supported in this browser.");
} else if (!WEBGL.isWebGLAvailable()) {
  console.error("WebGL is not supported in this browser.");
}

class App {
  /**
   * @param  {Element} el
   * @param  {Location} location
   */
  constructor(el, location) {
    this.options = {
      kiosk: Boolean(false),
      model: "",
      preset: "",
      cameraPosition: null,
    };

    this.el = el;
    this.viewer = null;
    this.viewerEl = null;
    this.dropEl = el.querySelector(".dropzone");
    this.inputEl = el.querySelector("#file-input");

    this.createDropzone();

    const options = this.options;


    if (options.model) {
      this.view(options.model, "", new Map());
    }
  }

  /**
   * Sets up the drag-and-drop controller.
   */
  createDropzone() {
    const dropCtrl = new SimpleDropzone(this.dropEl, this.inputEl);
    dropCtrl.on("drop", ({ files }) => this.load(files));
  }

  /**
   * Sets up the view manager.
   * @return {Viewer}
   */
  createViewer() {
    this.viewerEl = document.createElement("div");
    this.viewerEl.classList.add("viewer");
    this.dropEl.innerHTML = "";
    this.dropEl.appendChild(this.viewerEl);
    this.viewer = new Viewer(this.viewerEl, this.options);
    return this.viewer;
  }

  /**
   * Loads a fileset provided by user action.
   * @param  {Map<string, File>} fileMap
   */
  load(fileMap) {
    let rootFile;
    let rootPath;
    Array.from(fileMap).forEach(([path, file]) => {
      if (file.name.match(/\.(gltf|glb)$/)) {
        rootFile = file;
        rootPath = path.replace(file.name, "");
      }
    });

    if (!rootFile) {
      this.onError("No .gltf or .glb asset found.");
    }

    this.view(rootFile, rootPath, fileMap);
  }

  /**
   * Passes a model to the viewer, given file and resources.
   * @param  {File|string} rootFile
   * @param  {string} rootPath
   * @param  {Map<string, File>} fileMap
   */
  view(rootFile, rootPath, fileMap) {
    if (this.viewer) this.viewer.clear();

    const viewer = this.viewer || this.createViewer();

    const fileURL =
      typeof rootFile === "string" ? rootFile : URL.createObjectURL(rootFile);

    const cleanup = () => {
      if (typeof rootFile === "object") URL.revokeObjectURL(fileURL);
    };

    viewer
      .load(fileURL, rootPath, fileMap)
      .catch((e) => this.onError(e))
      .then((gltf) => {
        cleanup();
      });
  }

  /**
   * @param  {Error} error
   */
  onError(error) {
    let message = (error || {}).message || error.toString();
    if (message.match(/ProgressEvent/)) {
      message =
        "Unable to retrieve this file. Check JS console and browser network tab.";
    } else if (message.match(/Unexpected token/)) {
      message = `Unable to parse file content. Verify that this file is valid. Error: "${message}"`;
    } else if (error && error.target && error.target instanceof Image) {
      message = "Missing texture: " + error.target.src.split("/").pop();
    }
    window.alert(message);
    console.error(error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new App(document.body, location);
});
