#!/bin/bash
[ -z "$2" ] && PORT=3000 || PORT=$2
[ -z "$1" ] && {
        echo "usage:$0 <release>"
        exit 1
}

[ -f app.js ] || {
        echo "wrong root directory"
        exit 1
}
echo "#git pull -q --no-ff origin $1"

git pull --no-ff origin $1

echo "#restart server $1"
fuser -k $PORT/tcp;

echo "#node app"
sleep 4;
node app >> $HOME/www/logs/node-kariboo.logs&