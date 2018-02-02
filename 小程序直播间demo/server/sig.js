var crypto = require('crypto');
var zlib = require('zlib');
var fs = require('fs');
var path = require('path');

var base64url = {};

base64url.unescape = function unescape (str) {
    return (str + Array(5 - str.length % 4))
        .replace(/_/g, '=')
        .replace(/\-/g, '/')
        .replace(/\*/g, '+');
};

base64url.escape = function escape (str) {
    return str.replace(/\+/g, '*')
        .replace(/\//g, '-')
        .replace(/=/g, '_');
};

base64url.encode = function encode (str) {
    return this.escape(new Buffer(str).toString('base64'));
};

base64url.decode = function decode (str) {
    return new Buffer(this.unescape(str), 'base64').toString();
};

/**
* 下列接口提供了初始化，生成 sig 和校验 sig 的功能，可以直接使用
*/

/**
* 此处 config 指定的是公私钥路径，可以考虑直接使用公私钥的内容，
* 而且可以单独使用私钥生成 sig，公钥并不是必须的
*/
var Sig = function(config){
    this.sdk_appid  = config.sdk_appid;
    this.expire_after = (config.expire_after || 180 * 24 * 3600).toString();
    this.private_key = fs.readFileSync(path.join(__dirname, config.private_key)).toString();
    this.public_key = fs.readFileSync(path.join(__dirname, config.public_key)).toString();
};

Sig.prototype.setAppid = function(appid){
    this.sdk_appid = appid;
};

Sig.prototype.setPrivateKey = function(private_key){
    this.private_key = private_key;
};

Sig.prototype.setPublicKey = function(public_key){
    this.public_key = public_key;
};

/**
* ECDSA-SHA256签名
* @param string $data 需要签名的数据
* @return string 返回签名 失败时返回false
*/
Sig.prototype._sign = function(str){
    var signer = crypto.createSign('sha256');
    signer.update(str, 'utf8');
    return signer.sign(this.private_key, 'base64');
};

/**
* 验证ECDSA-SHA256签名
* @param string $data 需要验证的数据原文
* @param string $sig 需要验证的签名
* @return int 1验证成功 0验证失败
*/
Sig.prototype._verify = function(str, signture){
    var verify = crypto.createVerify('sha256');
    verify.update(str, 'utf8');
    var result = verify.verify(this.public_key, signture, 'base64');
    return result;
};

/**
* 根据json内容生成需要签名的buf串
* @param array $json 票据json对象
* @return string 按标准格式生成的用于签名的字符串
* 失败时返回false
*/
Sig.prototype._genSignContent = function(obj){
    var arr = [
        'TLS.appid_at_3rd',
        'TLS.account_type',
        'TLS.identifier',
        'TLS.sdk_appid',
        'TLS.time',
        'TLS.expire_after'
    ];

    var ret = '';
    for (var i = 0; i < arr.length; i++) {
        ret += arr[i] + ':' + obj[arr[i]] + '\n';
    }

    return ret;
};

/**
* 生成 usersig
* @param string $identifier 用户名
* @return string 生成的失败时为false
*/
Sig.prototype.genSig = function(identifier){
    var obj = {
        'TLS.account_type': "0",
        'TLS.identifier': ""+identifier,
        'TLS.appid_at_3rd': "0",
        'TLS.sdk_appid': ""+this.sdk_appid,
        'TLS.expire_after': ""+this.expire_after,
        'TLS.version': "201610110000",
        'TLS.time': (Math.floor(Date.now()/1000)).toString()
    };

    var content = this._genSignContent(obj);
    var signature = this._sign(content);
    obj['TLS.sig'] = signature;

    var text = JSON.stringify(obj);
    var compressed = zlib.deflateSync(new Buffer(text)).toString('base64');

    return base64url.escape(compressed);
};

/**
* 验证usersig
* @param type $sig usersig
* @param type $identifier 需要验证用户名
* @return false 失败，true 成功
*/
Sig.prototype.verifySig = function(sig, identifier) {
    try {
        var compressed = base64url.unescape(sig);
        var text = zlib.inflateSync(new Buffer(compressed, 'base64'));
        var json = JSON.parse(text);
        if (json['TLS.identifier'] !== identifier) {
            return false;
        }

        var content = this._genSignContent(json);
        return this._verify(content, json['TLS.sig']);

    } catch (e) {
        return false;
    }
};

exports.Sig = Sig;