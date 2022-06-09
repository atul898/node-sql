'use strict';

var Harness = require('./support');
var customer = Harness.defineCustomerTable();
var Sql = require('../../lib').setDialect('postgres');

Harness.it({
  query: customer.select(customer.metadata.regex('age')),
  pg: {
    text  : 'SELECT ("customer"."metadata" ~ $1) FROM "customer"',
    string: 'SELECT ("customer"."metadata" ~ \'age\') FROM "customer"'
  },
  params: ['age']
});

Harness.it({
  query: customer.select(customer.metadata.iregex('age')),
  pg: {
    text  : 'SELECT ("customer"."metadata" ~* $1) FROM "customer"',
    string: 'SELECT ("customer"."metadata" ~* \'age\') FROM "customer"'
  },
  params: ['age']
});

Harness.it({
  query: customer.select(customer.metadata.notRegex('age')),
  pg: {
    text  : 'SELECT ("customer"."metadata" !~ $1) FROM "customer"',
    string: 'SELECT ("customer"."metadata" !~ \'age\') FROM "customer"'
  },
  params: ['age']
});

Harness.it({
  query: customer.select(customer.metadata.notIregex('age')),
  pg: {
    text  : 'SELECT ("customer"."metadata" !~* $1) FROM "customer"',
    string: 'SELECT ("customer"."metadata" !~* \'age\') FROM "customer"'
  },
  params: ['age']
});
