#!/bin/bash
if [ -f hn.db ]; then
    datasette hn.db
else
    sqlite-utils insert hn.db news data.csv --csv
    datasette hn.db
fi
