#!/bin/sh

# 
# https://developers.facebook.com/docs/games/build/instant-games/get-started/test-publish-share
# 
# ENABLE! chrome://flags/#allow-insecure-localhost

http-server --ssl -c-1 -p 8080 -a 127.0.0.1 src


# open https://www.facebook.com/embed/instantgames/2184426505072200/player?game_url=https://localhost:8080