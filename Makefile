.PHONY: src utils

all: bin/fava node_modules

node_modules:
	npm install
	cd app && npm install

bin/fava: build/fava
	cd build/fava; git fetch; git reset --hard origin/master
	make -C build/fava pyinstaller
	mkdir -p app/bin
	cp build/fava/dist/fava app/bin/fava

build/fava:
	git clone git@github.com:aumayr/fava.git build/fava

clean:
	rm -rf build/fava app/bin dist
	rm -rf node_modules app/node_modules

icons:
	iconutil -c icns utils/FavaDesktop.iconset
