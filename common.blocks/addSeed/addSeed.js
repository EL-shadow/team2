modules.define('addSeed', ['i-bem__dom', 'attach'], function (provide, BEMDOM, Attach) {

    provide(BEMDOM.decl(this.name,
        {
            /* методы экземпляра */
            onSetMod: {
                'js': {
                    'inited': function () {
                        Attach.on(this.domElem, 'loadPreview', this._onLoadPreview, this);
                    }
                }
            },
            _onLoadPreview: function (e, loading) {
                this.findBlockInside('spin').setMod('visible', loading);
                this.findBlockInside('attach').setMod('disabled', loading);
            }
        })
    );

});
