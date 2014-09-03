
REPORTER ?= dot
SRC = $(shell find lib -name "*.js" -type f | sort)
SUPPORT = $(wildcard support/*.js)


test: test-unit

test-all: test-unit


test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		test/*.js

clean:
	rm -fr lib-cov
	rm -f coverage.html

test-cov: lib-cov
	@COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	@rm -fr ./$@
	@jscoverage models $@

coverage:
	jscoverage --no-highlight lib lib-cov
	@NODE_ENV=test EXAMPLE_COV=1 ./node_modules/.bin/mocha  -R html-cov > coverage.html
	rm -rf lib-cov

.PHONY: test-cov test test-all test-unit clean test-cov lib-cov
