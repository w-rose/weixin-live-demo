var encrypt = require('encrypt.js');
var http = require('../common/http.js')

var identifier = 'yezi'

var sdkappid = 1400067783;
// 获取identifier和TmpSig
function anologin(data, cb){
      http.api({
            url: 'login', //仅为示例，并非真实的接口地址
            data: data,
            method: 'post',
            success: function(res) {
              if (res.data.code === 0) {
                cb({
                  Identifier: res.data.identifier,
                  UserSig: res.data.sig
                })
              }                
            }
        });
}



function login(opts){
    wx.request({
        url: 'https://tls.qcloud.com/getUserSig', //仅为示例，并非真实的接口地址
        data: {
            "tmpsig": opts.TmpSig,
            "identifier": opts.Identifier,
            "sdkappid": sdkappid
        },
        method: 'GET',
        header: {
            // 'content-type': 'application/json'
        },
        success: function(res) {
            var matches = res.data.match(/tlsGetUserSig\((.*?)\)/);
            var UserSig = JSON.parse(matches[1])['UserSig'];
            opts.success && opts.success({
                Identifier : opts.Identifier,
                UserSig : UserSig
            });
        },
        fail : function(errMsg){
            opts.error && opts.error(errMsg);
        }
    });
}

module.exports = {
    init : function(opts){
        sdkappid = opts.sdkappid;
    },
    anologin : anologin,
    login : login
};