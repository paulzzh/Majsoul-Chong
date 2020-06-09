// ==UserScript==
// @name         【雀魂】最近大铳
// @namespace    https://paulzzh.tech/
// @supportURL   https://github.com/paulzzh/Majsoul-Chong
// @version      2.0.2
// @description  最近大铳插件，让最近大和区域显示最近大铳
// @author       Paulzzh
// @license      MIT
// @match        *://majsoul.com/1/
// @match        *://www.majsoul.com/1/
// @match        *://game.maj-soul.com/1/
// @match        *://game.mahjongsoul.com/
// @match        *://mahjongsoul.game.yo-star.com/
// @grant        none
// @icon         https://img.paulzzh.tech/other/majsoul/zjdc.png
// ==/UserScript==

(function() {
    'use strict';
    window.paulzzh_plugin_zjdc = {};
    paulzzh_plugin_zjdc.enable = true; //是否上报，提供给 青天井，牌谱修改 等插件一个关闭上报的接口。
    
    //==================================
    //
    //        最近大铳 插件配置
    //
    //最近大铳 数据交换服务器   一般情况下不需要修改。
    //为了确认用户身份，会收集您和他人的account_id,昵称,对局日期,和(铳)牌信息等信息；会储存您和他人的account_id,和(铳)牌信息等信息。
    paulzzh_plugin_zjdc.server = "https://majsoul.paulzzh.tech/api/v2/zjdc?version=2.0.1";
    
    //大铳大和切换延迟(毫秒)
    paulzzh_plugin_zjdc.display_showtime = 3000;
    
    //插件注入成功后是否展示提示框
    paulzzh_plugin_zjdc.show_welcome = true;
    
    //==================================
    
    
    //切换大铳大和
    paulzzh_plugin_zjdc.display = function() {
        var vui=paulzzh_plugin_zjdc.display_vui;
        var datas = paulzzh_plugin_zjdc.display_data;
        var data=datas[paulzzh_plugin_zjdc.display_which%datas.length];
        vui.me.getChildAt(0).getChildAt(0).text = data.text;
        vui.me.getChildAt(0).getChildAt(0).color = data.color;
        vui.me.getChildAt(0).getChildAt(0).font = data.font;
        vui._showDaHe(data.data.hands, data.data.ming, data.data.hupai);
        vui._setTitle(data.data.title_id);
        paulzzh_plugin_zjdc.display_which +=1;
    };
    paulzzh_plugin_zjdc.display_inv = [];
    
    paulzzh_plugin_zjdc.display_clear = function(){
        var l=paulzzh_plugin_zjdc.display_inv.length;
        for(var i=0; i<l ; i++){
            clearInterval(paulzzh_plugin_zjdc.display_inv.shift());
        }
    }
    
    //网络请求，铳牌获取
    paulzzh_plugin_zjdc.xhr = function(vui,account_id,which,t) {
        paulzzh_plugin_zjdc.display_clear();
        vui.me.getChildAt(0).getChildAt(0).text = "最近大和";
        vui.me.getChildAt(0).getChildAt(0).color = "#e8af71";
        vui.me.getChildAt(0).getChildAt(0).font = "fengyu";
        paulzzh_plugin_zjdc.display_which = 0;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200 && account_id==paulzzh_plugin_zjdc.account_id && which==paulzzh_plugin_zjdc.which) {
                try {
                    paulzzh_plugin_zjdc.display_clear();
                    var ret = JSON.parse(xhr.responseText);
                    if (ret.code) {
                        var data = []
                        if (ret.data_c){
                            data.push({"text":"最近大铳","color":"#ff4e4e","font":"fengyu","data":ret.data_c});
                        };
                        if (ret.data_z){
                            //雀魂fengyu字体没有"炸"这个字。。没办法只能换字体
                            data.push({"text":"最近炸庄","color":"#c1c630","font":"SimHei","data":ret.data_z});
                        };
                        if (t.statistic_data){
                            for (var a = 0; a < t.statistic_data.length; a++) {
                                var r = t.statistic_data[a];
                                if (which==String(r.mahjong_category)+String(r.game_category)){
                                    data.push({"text":"最近大和","color":"#e8af71","font":"fengyu","data":r.statistic.highest_hu});
                                    break
                                }
                            }
                        };
                        paulzzh_plugin_zjdc.display_data=data;
                        paulzzh_plugin_zjdc.display_vui=vui;
                        paulzzh_plugin_zjdc.display_inv.push(setInterval(paulzzh_plugin_zjdc.display,paulzzh_plugin_zjdc.display_showtime));
                    }
                } catch(error) {
                    console.log("[最近大铳]" + error.message)
                }
            }
        };
        xhr.open("post", paulzzh_plugin_zjdc.server, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        var tosend={"action":"query","self_id":GameMgr.Inst.account_id,"target_id":account_id,"type":which};
        console.log(tosend);
        xhr.send(JSON.stringify(tosend));
    };
    
    //网络请求，对局记录
    paulzzh_plugin_zjdc.postxhr = function(uuid) {
        if (paulzzh_plugin_zjdc.enable && GameMgr.Inst.ingame && uuid.length==43){
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var ret = JSON.parse(xhr.responseText);
                    console.log(ret.message)
                }
            };
            xhr.open("post", paulzzh_plugin_zjdc.server, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            var tosend={"action":"push","self_id":GameMgr.Inst.account_id,"uuid":uuid,"area":GameMgr.client_language};
            console.log(tosend);
            xhr.send(JSON.stringify(tosend));
        }
    };
    
    //对于雀魂的hack
    paulzzh_plugin_zjdc.hook = function() {
        try {
            //需要注入的东西，要在游戏加载完后修改
            if (uiscript.UI_PlayerInfo.Inst && uiscript.UI_OtherPlayerInfo.Inst && uiscript.UI_PlayerInfo.Inst.show && uiscript.UI_OtherPlayerInfo.Inst.show && uiscript.UI_PlayerInfo.Inst.detail_data.blocks[0].show && uiscript.UI_OtherPlayerInfo.Inst.detail_data.blocks[0].show && game.Scene_MJ.Inst.GameEnd) {
                console.log("[最近大铳]游戏已登录");
                try {
                    //自己详情页
                    paulzzh_plugin_zjdc.funcpds = uiscript.UI_PlayerInfo.Inst.detail_data.blocks[0].show;
                    uiscript.UI_PlayerInfo.Inst.detail_data.blocks[0].show = function(t, e, i) {
                        var w = String(e)+String(i);
                        var vui = uiscript.UI_PlayerInfo.Inst.detail_data.blocks[0];
                        var account_id = GameMgr.Inst.account_id;
                        
                        //xhr异步问题,为了验证一下选项卡是否更改
                        paulzzh_plugin_zjdc.which=w;
                        paulzzh_plugin_zjdc.account_id=account_id;
                        
                        paulzzh_plugin_zjdc.xhr(vui,account_id,w,t);
                        paulzzh_plugin_zjdc.funcpds.apply(this, [t, e, i])
                    };
                    //别人详情页
                    paulzzh_plugin_zjdc.funcopds = uiscript.UI_OtherPlayerInfo.Inst.detail_data.blocks[0].show;
                    uiscript.UI_OtherPlayerInfo.Inst.detail_data.blocks[0].show = function(t, e, i) {
                        var w = String(e)+String(i);
                        var vui = uiscript.UI_OtherPlayerInfo.Inst.detail_data.blocks[0];
                        var account_id = uiscript.UI_OtherPlayerInfo.Inst.account_id;
                        
                        //xhr异步问题,为了验证一下选项卡是否更改
                        paulzzh_plugin_zjdc.which=w;
                        paulzzh_plugin_zjdc.account_id=account_id;
                        
                        paulzzh_plugin_zjdc.xhr(vui,account_id,w,t);
                        paulzzh_plugin_zjdc.funcopds.apply(this, [t, e, i])
                    };
                    //对局结束了
                    paulzzh_plugin_zjdc.GameEnd = game.Scene_MJ.Inst.GameEnd;
                    game.Scene_MJ.Inst.GameEnd = function() {
                        paulzzh_plugin_zjdc.postxhr(GameMgr.Inst.mj_game_uuid);
                        paulzzh_plugin_zjdc.GameEnd.apply(this)
                    };
                    clearInterval(paulzzh_plugin_zjdc.inv);
                    console.log("[最近大铳]插件已成功注入！");
                    if(paulzzh_plugin_zjdc.show_welcome){
                        uiscript.UI_LightTips.Inst.show("【最近大铳】插件 已成功注入！");
                    }
                    if(localStorage.getItem("paulzzh_plugin_zjdc_xieyi") != "2.0.2"){
                    uiscript.UI_InfoLite.Inst.show("【最近大铳】插件 权限申请\n版本:2.0.2\n\n本插件会收集您和他人的account_id,昵称,对局日期,和(铳)牌信息等信息。\n会储存您和他人的account_id,和(铳)牌信息等信息。\n为了实现插件的基础功能，这些数据是必须的。\n他们会被上传到第三方服务器 "+paulzzh_plugin_zjdc.server+"\n本插件与雀魂官方无任何联系，放铳数据均来自安装此插件的用户主动上传。\n\n温馨提示：第一次使用没有放铳数据是无法显示的，建议您先铳个大的再在个人信息页查看~\n演示视频：av65372237(b站)\n开源地址:https://github.com/paulzzh/Majsoul-Chong\n\n此提示只会显示一次，确定后将不再提示。\n\n\n2.0.0更新：全新2.0.0版本发布，兼容国服日服美服，兼容铜/银/金/玉/王座/友人/比赛/休闲普通/宝牌狂热/明牌配牌/龙之目玉等三麻/四麻/活动场，其中除金玉王之外的房间依靠用户上报/好友推送\n\n欢迎来杠北战犯蓝毛毛的麻将群找姬萌萌玩：916143619（实时播报迫害毛毛）");
                    localStorage.setItem("paulzzh_plugin_zjdc_xieyi","2.0.2");
                    }
                } catch(error) {
                    console.log("[最近大铳]插件注入失败" + error.message)
                }
            } else {
                console.log("[最近大铳]游戏未加载完毕")
            }
        } catch(error) {
            console.log("[最近大铳]插件注入失败" + error.message)
        }
    };
    
    //检测雀魂加载状态
    paulzzh_plugin_zjdc.inv = setInterval(paulzzh_plugin_zjdc.hook,3000)
})();