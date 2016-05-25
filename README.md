# fava-electron

[`Electron`](http://electron.atom.io)-wrapper for [`fava`](https://github.com/aumayr/fava).

Run with `electron .`

## Development

To generate icons:

    $ iconutil -c icns FavaDesktop.iconset

To pack the application (on a Mac):

    $ electron-packager . Fava --platform=darwin --arch=x64 --icon=utils/FavaDesktop.icns --overwrite

---
**Caution**: This is far from finished. Consider it *alpha*-software. Contributions are very welcome :-)
