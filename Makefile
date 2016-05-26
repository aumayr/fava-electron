.PHONY: src utils

all: bin/fava node_modules

node_modules:
	npm install

bin/fava: build/fava
	cd build/fava; git fetch; git reset --hard origin/master
	make -C build/fava
	make -C build/fava pyinstaller
	mkdir -p bin
	cp build/fava/dist/fava bin/fava

build/fava:
	git clone git@github.com:aumayr/fava.git build/fava

clean:
	rm -rf build bin
	rm -rf node_modules

icons:
	iconutil -c icns utils/FavaDesktop.iconset

app:
	./node_modules/.bin/electron-packager . Fava --platform=darwin --arch=x64 --icon=utils/FavaDesktop.icns --overwrite
