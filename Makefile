GOCMD=go

all: help

.PHONY: up
up:
	pulumi up

.PHONY: down
down:
	pulumi down

.PHONY: stack.dev.destroy
stack.dev.destroy:
	pulumi stack rm dev

.PHONY: stack.stage.destroy
stack.stage.destroy:
	pulumi stack rm stage

.PHONY: stack.prod.destroy
stack.prod.destroy:
	pulumi stack rm prod

.PHONY: lambda.build.go
lambda.build.go:
	rm -f services/lambda/function/app.zip && \
		cd services/lambda/function/go && \
		GOOS=linux GOARCH=amd64 $(GOCMD) build -o main . && \
		zip ../app.zip main && \
		rm -f main

.PHONY: lambda.build.js
lambda.build.js:
	rm -f services/lambda/function/app.zip && \
		cd services/lambda/function/js && \
		zip -r ../app.zip .

.PHONY: lambda.build.py
lambda.build.py:
	rm -f services/lambda/function/app.zip && \
		cd services/lambda/function/python && \
		pip3 install requests -t . && \
		zip -r ../app.zip .

.PHONY: lambda.deploy.go
lambda.deploy.go: lambda.build.go up

.PHONY: lambda.deploy.js
lambda.deploy.js: lambda.build.js up

.PHONY: lambda.deploy.py
lambda.deploy.py: lambda.build.py up

.PHONY: help
help:
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<arg>${RESET}'
	@echo ''
	@echo 'Arguments:'
	@echo "  ${YELLOW}help              ${RESET} ${GREEN}Show this help message${RESET}"
	@echo "  ${YELLOW}lambda.build.go   ${RESET} ${GREEN}Build and zip the go code in 'function/go'${RESET}"
	@echo "  ${YELLOW}lambda.build.js   ${RESET} ${GREEN}Zip the js code in 'function/js'${RESET}"
	@echo "  ${YELLOW}lambda.build.py   ${RESET} ${GREEN}Zip the python code in 'function/python'${RESET}"
	@echo "  ${YELLOW}lambda.deploy.go  ${RESET} ${GREEN}Run 'build.go' and deploy zip file to AWS${RESET}"
	@echo "  ${YELLOW}lambda.deploy.js  ${RESET} ${GREEN}Run 'build.js' and deploy zip file to AWS${RESET}"
	@echo "  ${YELLOW}lambda.deploy.py  ${RESET} ${GREEN}Run 'build.py' and deploy zip file to AWS${RESET}"
