# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 18, 16, 14, 18-bullseye, 16-bullseye, 14-bullseye, 18-buster, 16-buster, 14-buster
ARG VARIANT=16-bullseye
FROM mcr.microsoft.com/devcontainers/javascript-node:0-${VARIANT}
# mcr.microsoft.com/devcontainers/universal:2

# Install tslint, typescript. eslint is installed by javascript image
ARG NODE_MODULES="tslint-to-eslint-config typescript"
RUN su node -c "umask 0002 && npm install -g ${NODE_MODULES}" \
    && npm cache clean --force > /dev/null 2>&1

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages
# RUN su node -c "npm install -g <your-package-list -here>"

# AV STUFF
# Step 1: Add n exports
# export PATH=~/.npm-global/bin:$PATH
# export N_PREFIX=$HOME/.local
# export N_PRESERVE_NPM=1
# export N_PRESERVE_COREPACK=1

# Step 2a: Install n
# npm i -g n

# Step 2b (Alternative): Change node version with NVM
# nvm install 16.19.0

# Step 3: Symlink workspaces folder
# from ~/ -> ln -s /workspaces/ workspaces

# from wadb -> npm install
# from wadb -> npm run build
# from demo -> npm run build
# from demo -> npm run package
# from demo -> npm run serve