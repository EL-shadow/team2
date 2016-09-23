/**
 * Created by el on 23.09.16.
 */
var chai = require('chai');
var should = chai.should();
chai.use(require('chai-things'));
var expect = chai.expect;


var mongoose = require('mongoose');
var Seed = require('../server/models/seed.js');
var seed = new Seed({
    author: '57bb1220489d8a7436ab1058',
    msg : 'test'
});


describe('Seed link wrapper',function(){
    describe('Обрабатывает текст и преобразует в объекты ссылок ник, хэш или ссылку', function () {
        it("При тексте: text возвращает массив из одного элемента", function() {
            seed.msg = 'text';
            seed.msgWrapped.should.be.a('array');
            expect(seed.msgWrapped).to.have.length(1);
        });
        it("При тексте: @nick - возвращает массив содержащий объект link для шаблонизатора с полем url: /profile/nick ", function() {
            seed.msg = '@nick';
            var wrapped = seed.msgWrapped;
            expect(wrapped).to.include({ block: 'link', url: '/profile/nick', content: '@nick' });
        });
        it("При тексте: #hash - возвращает массив содержащий объект link для шаблонизатора с полем url: /search/?text=%23hash ", function() {
            seed.msg = '#hash';
            var wrapped = seed.msgWrapped;
            wrapped.should.be.a('array');
            expect(wrapped).to.include({ block: 'link', url: '/search/?text=%23hash', content: '#hash' });
        });
        it("При тексте: http://test.com - возвращает массив содержащий объект link для шаблонизатора с полем url: http://test.com ", function() {
            seed.msg = 'http://test.com';
            var wrapped = seed.msgWrapped;
            wrapped.should.be.a('array');
            expect(wrapped).to.include({ block: 'link', url: 'http://test.com',content: 'http://test.com', target: '_blank' });
        });
    });
    describe('Парсит строку и преобразует в объект ссылки', function () {
        var msgList = [
            {msg: ' @nick', url: '/profile/nick'},
            {msg: '@nick ', url: '/profile/nick'},
            {msg: ' @nick ', url: '/profile/nick'},
            {msg: '@SuPeR_N-iCk', url: '/profile/SuPeR_N-iCk'},
            {msg: '@microsoft.com', url: '/profile/microsoft'},
            {msg: ' #hash', url: '/search/?text=%23hash'},
            {msg: '#hash ', url: '/search/?text=%23hash'},
            {msg: ' #hash ', url: '/search/?text=%23hash'},
            {msg: ' #HASH_', url: '/search/?text=%23HASH_'},
            {msg: ' http://yandex.ru/', url: 'http://yandex.ru/'},
            {msg: 'http://yandex.ru/ ', url: 'http://yandex.ru/'},
            {msg: ' http://yandex.ru/ ', url: 'http://yandex.ru/'},
            {msg: 'http://яндекс.рф/', url: 'http://яндекс.рф/'}
        ];
        msgList.forEach(function (testItem) {
            it("Текст: '" + testItem.msg + "'  - преобразовал в ссылку: " + testItem.url, function () {
                seed.msg = testItem.msg;
                var wrapped = seed.msgWrapped;
                wrapped.should.be.a('array');
                wrapped.should.include.something.that.deep.property('url', testItem.url);
            });
        })
    });
    describe('Парсит строку и не преобразует строки не являющиеся ключами ссылок', function () {
        var msgList = [
            {msg: ' "@nick'},
            {msg: '@@nick '},
            {msg: '@@@@@'},
            {msg: 'def test@microsoft.com def '},
            {msg: '##hash'},
            {msg: 'abc#hash  '},
            {msg: 'ololohttp://test.com'}
        ];
        msgList.forEach(function (testItem) {
            it("В тексте: '" + testItem.msg + "'  - не была найдена ссылка для преобразования", function () {
                seed.msg = testItem.msg;
                var wrapped = seed.msgWrapped;
                wrapped.should.be.a('array');
                wrapped.should.not.include.something.that.deep.property('block');
            });
        })
    });

});
