'use strict';
var assert = require('assert');

var sql = require(__dirname + '/../lib').setDialect('postgres');

var user = sql.define({
  name: 'user',
  columns: [
    {name: 'id'}, 
    {name:'email'},
    {name: 'name'},
    {name: 'age', property: 'howOld'}
    ]
});

describe('function', function() {
  it('alias function call', function() {
    var upper = sql.functions.UPPER;
    var aliasedUpper = upper(user.email).as('upperAlias').toQuery();

    assert.equal(aliasedUpper.text, 'UPPER("user"."email") AS "upperAlias"');
  });

  it('function call on aliased column', function() {
    var round = sql.functions.ROUND;
    var aliasedRound = round(user.howOld, 2).toQuery();

    assert.equal(aliasedRound.text, 'ROUND("user"."age", $1)');
    assert.equal(aliasedRound.values[0], 2);
  });

  it('creating function call works', function() {
    var upper = sql.functionCallCreator('UPPER');
    var functionCall = upper('hello', 'world').toQuery();

    assert.equal(functionCall.text, 'UPPER($1, $2)');
    assert.equal(functionCall.values[0], 'hello');
    assert.equal(functionCall.values[1], 'world');
  });

  it('creating function call on columns works', function() {
    var upper = sql.functionCallCreator('UPPER');
    var functionCall = upper(user.id, user.email).toQuery();

    assert.equal(functionCall.text, 'UPPER("user"."id", "user"."email")');
    assert.equal(functionCall.values.length, 0);
  });

  it('function call inside select works', function() {
    var upper = sql.functionCallCreator('UPPER');
    var query = sql.select(upper(user.id, user.email)).from(user).where(user.email.equals('brian.m.carlson@gmail.com')).toQuery();

    assert.equal(query.text, 'SELECT UPPER("user"."id", "user"."email") FROM "user" WHERE ("user"."email" = $1)');
    assert.equal(query.values[0], 'brian.m.carlson@gmail.com');
  });

  it('standard aggregate functions with having clause', function() {
    var count = sql.functions.COUNT;
    var distinct = sql.functions.DISTINCT;
    var distinctEmailCount = count(distinct(user.email));

    var query = user.select(user.id, distinctEmailCount).group(user.id).having(distinctEmailCount.gt(100)).toQuery();

    assert.equal(query.text, 'SELECT "user"."id", COUNT(DISTINCT("user"."email")) FROM "user" GROUP BY "user"."id" HAVING (COUNT(DISTINCT("user"."email")) > $1)');
    assert.equal(query.values[0], 100);
  });

  it('custom and standard functions behave the same', function() {
    var standardUpper = sql.functions.UPPER;
    var customUpper = sql.functionCallCreator('UPPER');

    var standardQuery = user.select(standardUpper(user.name)).toQuery();
    var customQuery = user.select(customUpper(user.name)).toQuery();

    var expectedQuery = 'SELECT UPPER("user"."name") FROM "user"';
    assert.equal(standardQuery.text, expectedQuery);
    assert.equal(customQuery.text, expectedQuery);
  });

  it('combine function with operations', function() {
    var f = sql.functions;
    var query = user.select(f.AVG(f.DISTINCT(f.COUNT(user.id).plus(f.MAX(user.id))).minus(f.MIN(user.id))).multiply(100)).toQuery();

    assert.equal(query.text, 'SELECT (AVG((DISTINCT((COUNT("user"."id") + MAX("user"."id"))) - MIN("user"."id"))) * $1) FROM "user"');
    assert.equal(query.values[0], 100);
  });

  it('use custom function', function() {
    var query = user.select(sql.function('PHRASE_TO_TSQUERY')('simple', user.name)).toQuery();
    assert.equal(query.text, 'SELECT PHRASE_TO_TSQUERY($1, "user"."name") FROM "user"');
    assert.equal(query.values[0], 'simple');
  });
});
