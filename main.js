const {
  BrowserWindow,
  app,
  Menu,
  globalShortcut,
  ipcMain,
  shell,
} = require("electron");

const path = require("path");
const os = require("os");
const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const slash = require("slash");
const log = require("electron-log");

// Set env
process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "ImageShrink",
    width: 500,
    height: 600,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    backgroundColor: "gray",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(`./app/index.html`);
}

ipcMain.on("image:minimize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageshrink");
  shrinkImage(options);
});

async function shrinkImage({ imgPath, quality, dest }) {
  try {
    const pngQuality = quality / 100;

    const files = await imagemin([slash(imgPath)], {
      destination: dest,
      plugins: [
        imageminMozjpeg({ quality }),
        imageminPngquant({ quality: [pngQuality, pngQuality] }),
      ],
    });

    shell.openPath(dest);

    mainWindow.webContents.send("image:done");
  } catch (error) {
    log.error(error);
  }
}

app.on("ready", () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  globalShortcut.register("CmdOrCtrl+R", () => mainWindow.reload());

  globalShortcut.register(isMac ? "Command+Alt+I" : "Ctrl+Shift+I", () =>
    mainWindow.toggleDevTools()
  );

  mainWindow.on("closed", () => (mainWindow = null));
});

const menu = [
  {
    role: "fileMenu",
  },
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];
