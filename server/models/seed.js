var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = require('mongoose').Types.ObjectId;
var re = {
    nick: '@[a-z0-9_-]+',
    hash: '#[^\\s]+',
    link: 'https?:\\/\\/[^\\s]+'

};

var schema =  new Schema({
    msg: String,
    tags: [],
    mention: [],
    datetime: {
        type: Date,
        default: Date.now
    },
    parent: Schema.Types.ObjectId, // id Другого Seed
    child: [
        Schema.Types.ObjectId // id Другого Seed
    ],
    author: {
        type: Schema.Types.ObjectId, // id коллекции User
        required: true
    },
    image: String, // URL
    latlng: String,
    link: Schema.Types.ObjectId // id в кэше сниппетов ссылок
});

schema.statics.getCountPlain = function (user, opts, callback) {
  var seed = this;
  var fromtime = opts.fromtime || false;
  var newest = opts.newest || false;
  var author = opts.author || false;
  var agregators = [
      {
          $match: fromtime ? {
              datetime: {$lt: fromtime}
          } : {}
      },{
          $match: newest ? {
              datetime: {$gt: newest}
          } : {}
      },
      {
          $match: author && (author.length > 0) ? (
              author instanceof Array && author.length > 0 ? {
                  $or: author.map(function (item) {
                      return {author: new ObjectId(item)};
                  })
              } : {
                  author: new ObjectId(author)
              }
          ) : {
              author: null
          }
      }
  ];

  seed.aggregate(agregators, function(err, seeds) {
      if (err) return callback(err);
      callback(null, seeds.length);
  });
};

schema.statics.getPlain = function (user, opts, callback) {
    var seed = this;
    var fromtime = opts.fromtime || false;
    var newest = opts.newest || false;
    var author = opts.author || false;
    var search = opts.search || false;
    var tag = opts.tag || false;
    var agregators = [
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id", as: "user"
            }
        }, {
            $sort: {
                datetime: -1
            }
        },
        {
            $match: fromtime ? {
                datetime: {$lt: fromtime}
            } : {}
        },{
            $match: newest ? {
                datetime: {$gt: newest}
            } : {}
        },
        {
            $match: author && (author.length > 0) ? (
                author instanceof Array && author.length > 0 ? {
                    $or: author.map(function (item) {
                        return {author: new ObjectId(item)};
                    })
                } : {
                    author: new ObjectId(author)
                }
            ) : {}
        },
        {
            $match: search ? {
                msg: new RegExp(search)
            } : {}
        },
        {
            $match: tag ? {
                tags: tag
            } : {}
        },
        {
            $limit: 10
        }
];

    agregators.push();
    seed.aggregate(agregators, function(err, seeds) {
        if (err) return callback(err);
        var seedsPlain = seeds.map(function (seed) {
            return {
                id: seed._id,
                msg: wrapLinks(seed.msg),
                datetime: seed.datetime,
                parent: seed.parent, //Твит на который сделали ответ
                profile: seed.user[0],
                img: seed.image,
                tags: seed.tags,
                mention: seed.mention,
                followed: 1
            };
        });
        callback(null, seedsPlain);
    });
};

schema.statics.getSeed = function (seedId, callback) {
    var seed = this;
    var agregators = [
        {
            $lookup: {
                from: "users",
                localField: "author",
                foreignField: "_id", as: "user"
            }
        },
        {
            $match: { _id: mongoose.Types.ObjectId(seedId) }
        }
    ];

    seed.aggregate(agregators, function(err, seeds) {
        if (err) return callback(err);
        var seed = seeds[0] || null;
        var result = {
                id: seed._id,
                msg: wrapLinks(seed.msg),
                datetime: seed.datetime,
                parent: seed.parent, //Твит на который сделали ответ
                child: seed.child,
                profile: seed.user[0],
                img: seed.image,
                followed: 1
            };
        callback(null, result);
    });
};


function wrapLinks(msg) {
    var reNick = re.nick;
    var reHash = re.hash;
    var reLink = re.link;
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
    return msg;
};


schema.virtual('msgWrapped').get(function () {
    return wrapLinks(this.msg);
});


schema.post('save', function(doc) {
    if (doc.parent) {
        this.model('Seed').findByIdAndUpdate(doc.parent, {$push: {child: doc._id }}, function (err, doc){
            if (err) console.log(err);
        });
    }
});

schema.pre('save', function(next) {
    if (this.msg) {
        var tags = this.msg.match(new RegExp('(^|\\s)(' + re.hash + ')', 'g'));
        if (tags) {
            this.tags = tags.map(function(tag){
                return tag.trim().substr(1);
            });
        }

        var nicks = this.msg.match(new RegExp('(^|\\s)(' + re.nick + ')', 'ig'));
        if (nicks) {
            this.mention = nicks.map(function(nick){
                return nick.trim().substr(1);
            });
        }
    }
    next();
});

module.exports = mongoose.model('Seed', schema);
