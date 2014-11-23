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
sleep 2;
echo "#git pull  origin $1"
git pull origin $1
npm install

echo "#restart server $1"
fuser -k $PORT/tcp;

echo "#node $PWD/app"
node app >> $HOME/www/logs/node-kariboo.logs&
