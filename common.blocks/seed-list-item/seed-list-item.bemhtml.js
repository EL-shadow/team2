/**
 * Created by Yulia on 22.08.16.
 */

block('seed-list-item').content()(function () {
    var seed = this.ctx.seed;
    var moment = this.require('moment');
    // moment.lang("ru");

    var msg = seed.msg;

    var reNick = '@[a-z0-9_-]+';
    var reHash = '#[^\\s]+';
    var reLink = 'https?:\\/\\/[^\\s]+';
    msg = msg.split(new RegExp('(^|\\s)(' + reNick + '|' + reHash + '|' + reLink + ')', 'i'));
    msg = msg.map(function (word) {
        if (word.length) {
            word = new RegExp('^' + reNick + '$', 'i').test(word) ? {
                block: 'link',
                url: '/profile/' + word.substr(1),
                content: word
            } : new RegExp('^' + reHash + '$').test(word) ? {
                block: 'link',
                url: '/search/?text=' + encodeURIComponent(word),
                content: word
            } : new RegExp('^' + reLink + '$', 'i').test(word) ? {
                block: 'link',
                url: word,
                content: word,
                target: '_blank'
            } : word;
        }
        return word
    });

    return [
        {
            elem: 'item',
            content: [
                {
                    block: 'profile',
                    profile: seed.profile
                },
                {
                    elem: 'message',
                    // mix: {block: 'seed-list-item', elem: 'seed-link'},
                    // url: '/seed/view/' + seed.id,
                    content: [
                        {
                            block: 'link',
                            url: '/seed/view/' + seed.id,
                            content: {
                                elem: 'date',
                                mix: {block: 'seed-list-item', elem: 'date'},
                                content: moment(seed.datetime).fromNow()
                            }
                        },
                        {
                            elem: 'msg',
                            content: msg
                        },
                        seed.img ?
                        {
                            block: 'image',
                            url: seed.img,
                            alt: 'Seed Image',
                            height: 'auto'
                        } : ''
                    ]

                },
                {
                    elem: 'bottom',
                    content: [
                        {
                            block: 'button',
                            mods: {theme: 'islands', size: 'm', view: 'action', type: 'link'},
                            mix: {block: 'seed-list-item', elem: 'answer'},
                            url: '/seed/add/?id=' + seed.id,
                            text: 'Ответить'
                        },
                        seed.parent ? {
                            elem: 'reply',
                            content: '(Это ответ)'
                        } : ''
                    ]
                }
            ]
        }
    ];
});
