const {app, BrowserWindow} = require('electron')
const url = require('url')
const path = require('path')

function createWindow() {
	const win = new BrowserWindow({width: 800, height: 600})

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'demo.html'),
		protocol: 'file:',
		slashes: true,
	}))
}

app.on('ready', createWindow)
