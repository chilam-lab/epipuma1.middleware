BUILD_DIR := ./build
STAGING_REPO = ssh://sig@species.conabio.gob.mx/~/species-front-dev.git
PROD_REPO = ssh://sig@species.conabio.gob.mx/~/species-front-dev.git

install:
    npm install

staging: build git-staging deploy
    @ git tag -f staging
    @ echo "Staging deploy complete"

prod: build git-prod deploy
    @ git tag -f production
    @ echo "Production deploy complete"

# Build tasks
build: clean
    # whatever your build step is

# Sub-tasks
clean:
    @ rm -rf $(BUILD_DIR)

git-prod:
    @ cd $(BUILD_DIR) && \
    git init && \
    git remote add origin $(PROD_REPO)

git-staging:
    @ cd $(BUILD_DIR) && \
    git init && \
    git remote add origin $(STAGING_REPO)

deploy:
    @ cd $(BUILD_DIR) && \
    git add -A && \
    git commit -m "Release" && \
    git push -f origin +dev:refs/heads/dev

.PHONY: install build clean deploy git-prod git-staging prod staging