export const instanceTypeDisplay = {
  JUPYTER: 'Jupyter',
  RSTUDIO: 'RStudio',
  JUPYTER_LAB: 'Jupyter Lab',
  THEIA_PYTHON: 'Python IDE',
}

export const instanceDescriptions = {
  RSTUDIO: "RStudio provides free and open source tools for R and enterprise-ready professional software for data science teams to develop and share their work at scale.",
  JUPYTER_NOTEBOOK: "The Jupyter Notebook is a web-based interactive computational environment for creating Jupyter notebook documents.",
  JUPYTER_LAB: "JupyterLab is a web-based interactive development environment for Jupyter notebooks, code, and data.",
  THEIA_PYTHON: "Theia Python is an extensible platform to develop Python Cloud & Desktop IDEs with state-of-the-art web technologies.",
}

export const ServiceType = {
  /**
   * Jupyter notebook or Jupyter lab.
   */
  JUPYTER: "JUPYTER",
  /**
   * RStudio.
   */
  RSTUDIO: "RSTUDIO",
  /**
   * Tensorflow notebook.
   */
  TENSORFLOW: "TENSORFLOW",
  /**
   * PyTorch notebook.
   */
  PYTORCH: "PYTORCH",
  /**
   * PyTorch notebook.
   */
  THEIA_PYTHON: "THEIA_PYTHON",
  /**
   * Flask API.
   */
  FLASK_API: "FLASK_API",
}
/**
 * Defines the service loading states
 */
export const ServiceState = {
  /**
   * Indicates the container is being initilialized.
   */
  PENDING: "PENDING",
  /**
   * Indicates the container is running.
   */
  RUNNING: "RUNNING",
  /**
   * Indicates the container is being stopped.
   */
  STOPPING: "STOPPING",
  /**
   * Indicates the container is stopped.
   */
  STOPPED: "STOPPED",
  /**
   * Indicates the container is inactive.
   */
  INACTIVE: "INACTIVE",
  /**
   * Indicates the container is unknown.
   */
  UNKNOWN: "UNKNOWN",
}
/**
 * Workspace types
 */
export const WorkspaceType = {
  /**
   * Flask API. 
   */
  API: "API",
}