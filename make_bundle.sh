#!/bin/sh

tmp="bundle"
rm -rf "${tmp}" "${tmp}.zip"

mkdir "${tmp}"
cp docs/*.{"js","css","json"} "${tmp}/"
cp docs/index.html "${tmp}/"
cp -rf docs/img "${tmp}/"

# zip "${tmp}" "${tmp}.zip"

ditto -c -k --sequesterRsrc --keepParent "${tmp}" "${tmp}.zip"
rm -rf "${tmp}"
