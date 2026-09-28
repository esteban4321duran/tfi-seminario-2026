SRC_DIR=$(pwd)

docker run --rm \
	--user $(id -u):$(id -g) \
	--mount type=bind,src="${SRC_DIR}",dst=/src plantuml/plantuml \
	/src

mimeopen *.png
