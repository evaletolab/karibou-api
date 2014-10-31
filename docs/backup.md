### Mongodb backup and restor
* dump database ```mongodump -h <host>:31608 -d karibou-devel -u <user> -p<pass> -o .```
* restore db ```mongorestore -h <host>:31608 -d karibou-devel -u <user> -p <pass> backups/bson.files/```
