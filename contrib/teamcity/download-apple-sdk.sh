#!/usr/bin/env bash

export LC_ALL=C

set -euxo pipefail

: "${SDK_DL_REMOTE:=}"

usage() {
  echo "Usage: download-apple-sdk.sh dest_dir"
  echo "The SDK_DL_REMOTE environment variable should be set to a URL pointing to the folder containing the SDK archive, with no trailing /."
  echo "Output: prints the SDK file name"
}

if [ -z "${SDK_DL_REMOTE}" ] || [ $# -ne 1 ]; then
  usage
  exit 1
fi

DEST_DIR="$1"

: "${TOPLEVEL:=$(git rev-parse --show-toplevel)}"

OSX_SDK="Xcode-11.3.1-11C505-extracted-SDK-with-libcxx-headers.tar.gz"
OSX_SDK_SHA256="a1b8af4c4d82d519dd5aff2135fe56184fa758c30e310b5fb4bfc8d9d3b45d8a"

pushd "${DEST_DIR}" > /dev/null
if ! echo "${OSX_SDK_SHA256}  ${OSX_SDK}" | sha256sum --quiet -c > /dev/null 2>&1; then
  rm -f "${OSX_SDK}"
  wget -q "${SDK_DL_REMOTE}/${OSX_SDK}"
  echo "${OSX_SDK_SHA256}  ${OSX_SDK}" | sha256sum --quiet -c
fi
popd > /dev/null

echo "${OSX_SDK}"
