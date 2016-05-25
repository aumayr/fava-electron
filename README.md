# fava-electron

[`Electron`](http://electron.atom.io)-wrapper for [`fava`](https://github.com/aumayr/fava).

Run with `electron .`

## Development

To generate icons:

    $ iconutil -c icns FavaDesktop.iconset

To pack the application (on a Mac; currently not working!):

    $ electron-packager . Fava --platform=darwin --arch=x64 --icon=utils/FavaDesktop.icns --version=0.36.3 --overwrite

---
**Caution**: This is far from finished. Consider it *alpha*-software. Contributions are very welcome :-)
