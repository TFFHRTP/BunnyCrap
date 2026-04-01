var Game={
    level:1,
    title:"BunnyCrap",
    //Global variables
    HBOUND:innerWidth,//$('body')[0].scrollWidth
    VBOUND:innerHeight,//$('body')[0].scrollHeight
    infoBox:{
        x:145,
        y:innerHeight-110,
        width:innerWidth-295,
        height:110
    },
    teams:{},
    cxt:$('#middleCanvas')[0].getContext('2d'),
    frontCxt:$('#frontCanvas')[0].getContext('2d'),
    backCxt:$('#backCanvas')[0].getContext('2d'),
    _timer:-1,
    _frameInterval:100,
    _clock:0,
    selectedUnit:{},
    allSelected:[],
    _oldAllSelected:[],
    addIntoAllSelected:function(chara,override){
        if (chara instanceof Gobj){
            //Add into allSelected if not included
            if (Game.allSelected.indexOf(chara)==-1) {
                if (override) Game.allSelected=chara;
                else Game.allSelected.push(chara);
                chara.selected=true;
            }
        }
        //Override directly
        if (chara instanceof Array) {
            if (override) Game.allSelected=chara;
            else chara.forEach(function(char){
                //Add into allSelected if not included
                if (Game.allSelected.indexOf(char)==-1) Game.allSelected.push(char);
            });
            chara.forEach(function(char){
                char.selected=true;
            });
        }
        //Sort allSelected by its name order
        Game.allSelected.sort(function(chara1,chara2){
            //Need sort building icon together
            var name1=(chara1 instanceof Building)?(chara1.inherited.name+'.'+chara1.name):chara1.name;
            var name2=(chara2 instanceof Building)?(chara2.inherited.name+'.'+chara2.name):chara2.name;
            return ([name1,name2].sort()[0]!=name1)?1:-1;
        });
        //Notify referee to redraw
        Referee.alterSelectionMode();
    },
    race:{
        selected:'Terran',//Terran race by default
        choose:function(race){
            this.selected=race;
            $('div#GamePlay').attr('race',race);
        }
    },
    layerSwitchTo:function(layerName){
        $('div.GameLayer').hide();
        $('#'+layerName).show(); //show('slow')
    },
    shouldDrawBunnyMount:function(chara){
        if (!(chara instanceof Unit)) return false;
        if (chara.status=="dead") return false;
        return true;
    },
    getBunnyVariant:function(chara){
        switch (chara.name){
            case "Zergling":
            case "Broodling":
            case "Larva":
            case "Drone":
                return "zergling";
            case "Hydralisk":
            case "Lurker":
            case "Queen":
            case "Defiler":
                return "hydralisk";
            case "Mutalisk":
            case "Guardian":
            case "Devourer":
            case "Scourge":
            case "Overlord":
                return "mutalisk";
            case "Ultralisk":
            case "InfestedTerran":
                return "ultralisk";
            case "Marine":
            case "Medic":
            case "SCV":
            case "Civilian":
                return "marine";
            case "Firebat":
            case "Goliath":
                return "marauder";
            case "Ghost":
            case "Vulture":
            case "Wraith":
            case "Valkyrie":
            case "Vessel":
            case "Dropship":
            case "Sarah":
            case "Kerrigan":
                return "reaper";
            case "Tank":
                return "tank";
            case "BattleCruiser":
            case "HeroCruiser":
                return "battlecruiser";
            case "Probe":
            case "Zealot":
            case "DarkTemplar":
                return "zealot";
            case "Dragoon":
            case "Observer":
            case "Arbiter":
            case "Corsair":
            case "Scout":
                return "stalker";
            case "Templar":
            case "DarkArchon":
                return "templar";
            case "Archon":
                return "archon";
            case "Carrier":
            case "Shuttle":
            case "Reaver":
                return "carrier";
            case "Kakaru":
                return "xelnaga";
            case "Ragnasaur":
            case "Rhynsdon":
            case "Ursadon":
            case "Bengalaas":
            case "Scantid":
                return "critter";
            default:
                return "mercenary";
        }
    },
    getBunnyAtlasRect:function(chara){
        var atlasRects={
            zergling:{x:18,y:58,w:172,h:164},
            baneling:{x:220,y:58,w:172,h:164},
            hydralisk:{x:424,y:58,w:172,h:164},
            mutalisk:{x:628,y:58,w:172,h:164},
            ultralisk:{x:832,y:58,w:172,h:164},
            marine:{x:18,y:356,w:172,h:170},
            marauder:{x:220,y:356,w:172,h:170},
            reaper:{x:424,y:356,w:172,h:170},
            tank:{x:628,y:356,w:172,h:170},
            battlecruiser:{x:832,y:356,w:172,h:170},
            zealot:{x:18,y:655,w:172,h:170},
            stalker:{x:220,y:655,w:172,h:170},
            templar:{x:424,y:655,w:172,h:170},
            archon:{x:628,y:655,w:172,h:170},
            carrier:{x:832,y:655,w:172,h:170},
            xelnaga:{x:18,y:1248,w:172,h:176},
            infested:{x:220,y:1248,w:172,h:176},
            mercenary:{x:424,y:1248,w:172,h:176},
            critter:{x:628,y:1248,w:172,h:176},
            dev:{x:832,y:1248,w:172,h:176}
        };
        var variant=Game.getBunnyVariant(chara);
        var sheetKey=variant;
        if (variant=="zergling") sheetKey=(chara.name=="Drone")?"baneling":"zergling";
        if (chara.name=="InfestedTerran") sheetKey="infested";
        if (chara.name=="Kakaru") sheetKey="xelnaga";
        if (chara.name=="Sarah" || chara.name=="Kerrigan") sheetKey="dev";
        if (variant=="hydralisk" || variant=="mutalisk" || variant=="ultralisk" || variant=="marine" ||
            variant=="marauder" || variant=="reaper" || variant=="tank" || variant=="battlecruiser" ||
            variant=="zealot" || variant=="stalker" || variant=="templar" || variant=="archon" ||
            variant=="carrier" || variant=="xelnaga" || variant=="critter" || variant=="mercenary") {
            sheetKey=sheetKey;
        }
        return atlasRects[sheetKey] || atlasRects.mercenary;
    },
    drawBunnyAtlasSprite:function(cxt,chara){
        var atlas=sourceLoader.sources.BunnyAtlas;
        if (!atlas) return false;
        var rect=Game.getBunnyAtlasRect(chara);
        var aspect=rect.w/rect.h;
        var drawHeight=Math.max(chara.height*1.7,rect.h*0.56);
        if (chara.name=="Tank" || chara.name=="BattleCruiser" || chara.name=="Carrier" || chara.name=="HeroCruiser") {
            drawHeight*=1.14;
        }
        var drawWidth=drawHeight*aspect;
        var drawX=chara.posX()-Map.offsetX-drawWidth/2;
        var drawY=chara.posY()-Map.offsetY-drawHeight*0.76;
        cxt.drawImage(atlas,rect.x,rect.y,rect.w,rect.h,drawX>>0,drawY>>0,drawWidth>>0,drawHeight>>0);
        return true;
    },
    getBunnyMountProfile:function(chara){
        var variant=Game.getBunnyVariant(chara);
        var scale=Math.max(1.05,Math.min(2.35,chara.width/36));
        var flyingLift=chara.isFlying?Math.max(18,(chara.height*0.28)>>0):0;
        var bodyScale=1.32;
        var heightScale=0.62;
        var fur="#f5efe1";
        var furShade="#dcc8ae";
        var stroke=chara.isEnemy?"#5f405d":"#6c4e35";
        var saddle=chara.isEnemy?"#7d1f37":"#8f4f21";
        var eye="#d83434";
        var glow=null;
        if (variant=="zergling") {
            fur="#5e3b2a";
            furShade="#3d251a";
            saddle="#7f3a20";
        }
        if (variant=="hydralisk") {
            fur="#6e5644";
            furShade="#433227";
            saddle="#8b5d2d";
            bodyScale=1.38;
        }
        if (variant=="mutalisk") {
            fur="#50463f";
            furShade="#2e2824";
            saddle="#5b3329";
        }
        if (variant=="ultralisk") {
            fur="#5a5049";
            furShade="#302925";
            saddle="#7b6b63";
            bodyScale=1.5;
            heightScale=0.7;
        }
        if (variant=="marine") {
            fur="#ede8dc";
            furShade="#d5ccbb";
            glow="#7fd4ff";
        }
        if (variant=="marauder") {
            fur="#4f4135";
            furShade="#312720";
            glow="#ff7a3c";
            bodyScale=1.42;
        }
        if (variant=="reaper") {
            fur="#6e6259";
            furShade="#413731";
            glow="#ff6a33";
        }
        if (variant=="tank" || variant=="battlecruiser") {
            fur="#dad5cb";
            furShade="#b2aba0";
            glow="#ff9d3c";
            bodyScale=1.52;
            heightScale=0.72;
        }
        if (variant=="zealot") {
            fur="#fff5e4";
            furShade="#ead8b8";
            glow="#57dfff";
        }
        if (variant=="stalker") {
            fur="#54493f";
            furShade="#2c2622";
            glow="#66cfff";
        }
        if (variant=="templar") {
            fur="#fff4ea";
            furShade="#dfcfbf";
            glow="#9d7dff";
        }
        if (variant=="archon" || variant=="xelnaga") {
            fur="#513e77";
            furShade="#271d40";
            stroke="#95c7ff";
            saddle="#5c4ab0";
            glow="#9ce7ff";
            bodyScale=1.4;
        }
        if (variant=="carrier") {
            fur="#42382e";
            furShade="#221c17";
            glow="#5fd2ff";
            bodyScale=1.55;
            heightScale=0.74;
        }
        if (variant=="critter") {
            fur="#fff8ee";
            furShade="#e4d6c1";
            glow="#a5e776";
        }
        if (variant=="mercenary") {
            fur="#7a634c";
            furShade="#4f3f30";
            glow="#a5ff72";
        }
        return {
            scale:scale,
            variant:variant,
            bodyWidth:Math.max(42,(chara.width*bodyScale)>>0),
            bodyHeight:Math.max(24,(chara.height*heightScale)>>0),
            centerY:chara.y-Map.offsetY+chara.height+12-flyingLift,
            spriteScale:Math.max(0.48,Math.min(0.84,0.72-(scale-1)*0.08)),
            riderLift:Math.max(18,(chara.height*0.46)>>0)+flyingLift,
            legLift:Math.max(9,(chara.height*0.22)>>0),
            stroke:stroke,
            fur:fur,
            furShade:furShade,
            saddle:saddle,
            eye:eye,
            glow:glow,
            shadowAlpha:chara.isFlying?0.78:0.92,
            bunnyOffsetY:chara.isFlying?-8:0
        };
    },
    drawBunnyMount:function(chara,cxt,charaX,charaY,layer){
        var profile=Game.getBunnyMountProfile(chara);
        var centerX=charaX+(chara.width/2>>0);
        var centerY=profile.centerY+profile.bunnyOffsetY;
        var bodyWidth=profile.bodyWidth;
        var bodyHeight=profile.bodyHeight;
        var facingLeft=(chara.direction==null)?false:(chara.direction>=5 || chara.direction<=1);
        var facing=-1;
        if (!facingLeft) facing=1;
        var headX=centerX+facing*bodyWidth*0.38;
        var hipX=centerX-facing*bodyWidth*0.18;

        cxt.save();
        cxt.globalAlpha*=profile.shadowAlpha;
        cxt.fillStyle=profile.fur;
        cxt.strokeStyle=profile.stroke;
        cxt.lineWidth=2;

        if (layer=="back") {
            if (profile.variant=="mutalisk" || profile.variant=="xelnaga") {
                cxt.fillStyle="rgba(33,26,30,0.85)";
                cxt.beginPath();
                cxt.moveTo(centerX-bodyWidth*0.06,centerY-bodyHeight*0.2);
                cxt.lineTo(centerX-bodyWidth*0.42,centerY-bodyHeight*0.46);
                cxt.lineTo(centerX-bodyWidth*0.18,centerY-bodyHeight*0.04);
                cxt.closePath();
                cxt.fill();
                cxt.beginPath();
                cxt.moveTo(centerX+bodyWidth*0.06,centerY-bodyHeight*0.2);
                cxt.lineTo(centerX+bodyWidth*0.42,centerY-bodyHeight*0.46);
                cxt.lineTo(centerX+bodyWidth*0.18,centerY-bodyHeight*0.04);
                cxt.closePath();
                cxt.fill();
            }
            cxt.fillStyle=profile.furShade;
            cxt.beginPath();
            cxt.ellipse(hipX,centerY+bodyHeight*0.1,bodyWidth*0.2,bodyHeight*0.28,0,0,Math.PI*2);
            cxt.fill();

            cxt.fillStyle=profile.fur;
            cxt.beginPath();
            cxt.ellipse(centerX,centerY,bodyWidth*0.47,bodyHeight*0.42,0,0,Math.PI*2);
            cxt.fill();
            cxt.stroke();

            cxt.fillStyle=profile.furShade;
            cxt.beginPath();
            cxt.ellipse(centerX-bodyWidth*0.06,centerY-bodyHeight*0.06,bodyWidth*0.22,bodyHeight*0.14,0,0,Math.PI*2);
            cxt.fill();

            cxt.beginPath();
            cxt.ellipse(hipX,centerY+bodyHeight*0.02,bodyWidth*0.2,bodyHeight*0.3,0,0,Math.PI*2);
            cxt.fill();
            cxt.stroke();

            cxt.strokeStyle="rgba(68,48,31,0.9)";
            cxt.beginPath();
            cxt.moveTo(centerX-facing*bodyWidth*0.12,centerY+bodyHeight*0.16);
            cxt.lineTo(centerX-facing*bodyWidth*0.12,centerY+bodyHeight*0.72);
            cxt.moveTo(centerX-facing*bodyWidth*0.28,centerY+bodyHeight*0.08);
            cxt.lineTo(centerX-facing*bodyWidth*0.3,centerY+bodyHeight*0.64);
            cxt.stroke();

            cxt.fillStyle=profile.saddle;
            cxt.fillRect(centerX-bodyWidth*0.16,centerY-bodyHeight*0.34,bodyWidth*0.32,bodyHeight*0.24);
            cxt.strokeStyle=profile.stroke;
            cxt.strokeRect(centerX-bodyWidth*0.16,centerY-bodyHeight*0.34,bodyWidth*0.32,bodyHeight*0.24);

            if (profile.variant=="tank" || profile.variant=="battlecruiser" || profile.variant=="carrier") {
                cxt.fillStyle="#72695e";
                cxt.fillRect(centerX-bodyWidth*0.3,centerY+bodyHeight*0.02,bodyWidth*0.6,bodyHeight*0.22);
                cxt.strokeRect(centerX-bodyWidth*0.3,centerY+bodyHeight*0.02,bodyWidth*0.6,bodyHeight*0.22);
            }
        }

        if (layer=="front") {
            cxt.fillStyle=profile.fur;
            cxt.beginPath();
            cxt.ellipse(headX,centerY-bodyHeight*0.08,bodyWidth*0.2,bodyHeight*0.28,0,0,Math.PI*2);
            cxt.fill();
            cxt.stroke();

            cxt.beginPath();
            cxt.ellipse(headX-facing*bodyWidth*0.03,centerY-bodyHeight*0.76,bodyWidth*0.07,bodyHeight*0.72,facingLeft?-0.08:0.08,0,Math.PI*2);
            cxt.ellipse(headX+facing*bodyWidth*0.09,centerY-bodyHeight*0.74,bodyWidth*0.07,bodyHeight*0.68,facingLeft?-0.22:0.22,0,Math.PI*2);
            cxt.fill();
            cxt.stroke();

            if (profile.variant=="hydralisk" || profile.variant=="ultralisk" || profile.variant=="zergling") {
                cxt.strokeStyle="#8f6039";
                cxt.lineWidth=3;
                cxt.beginPath();
                cxt.moveTo(centerX-bodyWidth*0.02,centerY-bodyHeight*0.32);
                cxt.lineTo(centerX-bodyWidth*0.1,centerY-bodyHeight*0.62);
                cxt.moveTo(centerX+bodyWidth*0.02,centerY-bodyHeight*0.32);
                cxt.lineTo(centerX+bodyWidth*0.1,centerY-bodyHeight*0.62);
                cxt.stroke();
            }

            if (profile.variant=="zealot") {
                cxt.strokeStyle="#5be8ff";
                cxt.lineWidth=4;
                cxt.beginPath();
                cxt.moveTo(centerX-bodyWidth*0.22,centerY-bodyHeight*0.16);
                cxt.lineTo(centerX-bodyWidth*0.38,centerY-bodyHeight*0.56);
                cxt.moveTo(centerX+bodyWidth*0.22,centerY-bodyHeight*0.16);
                cxt.lineTo(centerX+bodyWidth*0.38,centerY-bodyHeight*0.56);
                cxt.stroke();
            }

            if (profile.variant=="archon" || profile.variant=="xelnaga") {
                cxt.fillStyle="rgba(126,210,255,0.26)";
                cxt.beginPath();
                cxt.arc(centerX,centerY-bodyHeight*0.06,bodyWidth*0.42,0,Math.PI*2);
                cxt.fill();
            }

            cxt.fillStyle=profile.furShade;
            cxt.beginPath();
            cxt.ellipse(centerX+facing*bodyWidth*0.2,centerY+bodyHeight*0.08,bodyWidth*0.23,bodyHeight*0.3,0,0,Math.PI*2);
            cxt.fill();
            cxt.stroke();

            cxt.fillStyle=profile.fur;
            cxt.beginPath();
            cxt.ellipse(centerX,centerY+bodyHeight*0.04,bodyWidth*0.18,bodyHeight*0.14,0,0,Math.PI*2);
            cxt.fill();

            cxt.strokeStyle="rgba(68,48,31,0.9)";
            cxt.beginPath();
            cxt.moveTo(centerX+facing*bodyWidth*0.12,centerY+bodyHeight*0.1);
            cxt.lineTo(centerX+facing*bodyWidth*0.14,centerY+bodyHeight*0.72);
            cxt.moveTo(centerX+facing*bodyWidth*0.3,centerY+bodyHeight*0.02);
            cxt.lineTo(centerX+facing*bodyWidth*0.32,centerY+bodyHeight*0.6);
            cxt.stroke();

            cxt.beginPath();
            cxt.moveTo(centerX-facing*bodyWidth*0.1,centerY-bodyHeight*0.14);
            cxt.quadraticCurveTo(headX-facing*bodyWidth*0.1,centerY-bodyHeight*0.22,headX-facing*bodyWidth*0.02,centerY-bodyHeight*0.08);
            cxt.stroke();

            cxt.fillStyle=profile.stroke;
            cxt.beginPath();
            cxt.arc(headX+facing*bodyWidth*0.08,centerY-bodyHeight*0.1,2.2,0,Math.PI*2);
            cxt.fill();

            if (profile.glow) {
                cxt.fillStyle=profile.glow;
                cxt.beginPath();
                cxt.arc(headX+facing*bodyWidth*0.08,centerY-bodyHeight*0.1,1.2,0,Math.PI*2);
                cxt.fill();
            }
        }

        cxt.restore();
    },
    getMountFaction:function(chara){
        var name=chara.name;
        if (["Drone","Zergling","Hydralisk","Mutalisk","Devourer","Guardian","Overlord","Scourge","Queen","Defiler","InfestedTerran","Ultralisk","Broodling","Larva","Lurker"].indexOf(name)!=-1) return "zerg";
        if (["SCV","Marine","Firebat","Ghost","Vulture","Tank","Goliath","Wraith","Dropship","Vessel","BattleCruiser","Valkyrie","Medic","Civilian"].indexOf(name)!=-1) return "terran";
        if (["Probe","Zealot","Dragoon","Templar","DarkTemplar","Reaver","Archon","DarkArchon","Shuttle","Observer","Arbiter","Scout","Carrier","Corsair"].indexOf(name)!=-1) return "protoss";
        if (["HeroCruiser","Sarah","Kerrigan"].indexOf(name)!=-1) return "hero";
        return "neutral";
    },
    getBunnyArmorPalette:function(chara){
        switch (Game.getBunnyVariant(chara)){
            case "zergling":
                return {plate:"#79422e",trim:"#c58f47",glow:"#84ff4d",cloth:"#4f2415",style:"zergling"};
            case "hydralisk":
                return {plate:"#6c4a34",trim:"#b98b53",glow:"#a6ff61",cloth:"#442717",style:"hydralisk"};
            case "mutalisk":
                return {plate:"#4d4446",trim:"#a87f74",glow:"#ff4d4d",cloth:"#2f2628",style:"mutalisk"};
            case "ultralisk":
                return {plate:"#6d6c72",trim:"#d9ba8a",glow:"#6fd6ff",cloth:"#4b494e",style:"ultralisk"};
            case "marine":
                return {plate:"#6f8fb4",trim:"#eef7ff",glow:"#72d9ff",cloth:"#3a4f6d",style:"marine"};
            case "marauder":
                return {plate:"#514136",trim:"#ff7442",glow:"#ff9b52",cloth:"#2d2320",style:"marauder"};
            case "reaper":
                return {plate:"#4a474a",trim:"#ff7a33",glow:"#ff6c2f",cloth:"#252327",style:"reaper"};
            case "tank":
                return {plate:"#9d6a43",trim:"#f3c770",glow:"#ff8638",cloth:"#70492c",style:"tank"};
            case "battlecruiser":
                return {plate:"#a47b3f",trim:"#f7d892",glow:"#ffb249",cloth:"#6e5026",style:"battlecruiser"};
            case "zealot":
                return {plate:"#37a9b8",trim:"#b7f8ff",glow:"#4bfbff",cloth:"#1c5e7c",style:"zealot"};
            case "stalker":
                return {plate:"#2f323f",trim:"#6db7ff",glow:"#5ec9ff",cloth:"#24222d",style:"stalker"};
            case "templar":
                return {plate:"#ffffff",trim:"#ffda69",glow:"#a17dff",cloth:"#6f4fb1",style:"templar"};
            case "archon":
                return {plate:"#6e63ff",trim:"#c8f2ff",glow:"#9df6ff",cloth:"#453cb1",style:"archon"};
            case "carrier":
                return {plate:"#d0a63a",trim:"#fff0a8",glow:"#69dbff",cloth:"#8e6a1d",style:"carrier"};
            case "xelnaga":
                return {plate:"#4b44ad",trim:"#b6dcff",glow:"#8ee9ff",cloth:"#302673",style:"xelnaga"};
            case "critter":
                return {plate:"#ffffff",trim:"#ffd574",glow:"#7de86d",cloth:"#c33b3b",style:"critter"};
            default:
                return {plate:"#737373",trim:"#c7d86d",glow:"#8eff73",cloth:"#4b4b4b",style:"mercenary"};
        }
    },
    getMountedSpriteBox:function(chara,charaX,charaY){
        var profile=Game.getBunnyMountProfile(chara);
        var width=(chara.width*profile.spriteScale)>>0;
        var height=(chara.height*profile.spriteScale)>>0;
        return {
            x:charaX+((chara.width-width)/2>>0),
            y:charaY-profile.riderLift,
            width:width,
            height:height
        };
    },
    drawMountedArmor:function(cxt,chara,charaX,charaY){
        var profile=Game.getBunnyMountProfile(chara);
        var box={
            x:charaX+((profile.bodyWidth*0.08)>>0),
            y:(profile.centerY+profile.bunnyOffsetY)-((profile.bodyHeight*1.02)>>0),
            width:(profile.bodyWidth*0.84)>>0,
            height:(profile.bodyHeight*0.96)>>0
        };
        var armor=Game.getBunnyArmorPalette(chara);
        var centerX=box.x+(box.width/2>>0);
        var centerY=box.y+(box.height/2>>0);
        var facingLeft=(chara.direction==null)?false:(chara.direction>=5 || chara.direction<=1);
        var facing=facingLeft?-1:1;

        cxt.save();
        cxt.lineWidth=2;
        cxt.strokeStyle="rgba(26,20,15,0.78)";

        cxt.fillStyle=armor.cloth;
        cxt.beginPath();
        cxt.roundRect(centerX-box.width*0.34,centerY-box.height*0.08,box.width*0.68,box.height*0.42,10);
        cxt.fill();

        cxt.fillStyle=armor.plate;
        cxt.beginPath();
        cxt.roundRect(centerX-box.width*0.28,centerY-box.height*0.26,box.width*0.56,box.height*0.42,10);
        cxt.fill();
        cxt.stroke();

        cxt.fillStyle=armor.trim;
        cxt.beginPath();
        cxt.ellipse(centerX-box.width*0.24,centerY-box.height*0.02,box.width*0.14,box.height*0.13,0,0,Math.PI*2);
        cxt.ellipse(centerX+box.width*0.24,centerY-box.height*0.02,box.width*0.14,box.height*0.13,0,0,Math.PI*2);
        cxt.fill();
        cxt.stroke();

        cxt.fillStyle=armor.plate;
        cxt.beginPath();
        cxt.ellipse(centerX,centerY-box.height*0.24,box.width*0.16,box.height*0.14,0,0,Math.PI*2);
        cxt.fill();
        cxt.stroke();

        cxt.fillStyle=armor.glow;
        cxt.beginPath();
        cxt.ellipse(centerX+facing*box.width*0.03,centerY-box.height*0.23,box.width*0.1,box.height*0.05,0,0,Math.PI*2);
        cxt.fill();

        cxt.fillStyle=armor.trim;
        cxt.beginPath();
        cxt.roundRect(centerX-box.width*0.12,centerY-box.height*0.02,box.width*0.24,box.height*0.18,5);
        cxt.fill();
        cxt.stroke();

        cxt.strokeStyle=armor.trim;
        cxt.lineWidth=4;
        cxt.beginPath();
        if (armor.style=="zergling" || armor.style=="hydralisk" || armor.style=="mutalisk" || armor.style=="ultralisk") {
            cxt.moveTo(centerX-box.width*0.24,centerY-box.height*0.16);
            cxt.lineTo(centerX-box.width*0.36,centerY-box.height*0.34);
            cxt.moveTo(centerX+box.width*0.24,centerY-box.height*0.16);
            cxt.lineTo(centerX+box.width*0.36,centerY-box.height*0.34);
        }
        else if (armor.style=="marine" || armor.style=="marauder" || armor.style=="reaper" || armor.style=="mercenary") {
            cxt.moveTo(centerX+facing*box.width*0.16,centerY-box.height*0.02);
            cxt.lineTo(centerX+facing*box.width*0.38,centerY+box.height*0.08);
            cxt.moveTo(centerX-facing*box.width*0.16,centerY-box.height*0.02);
            cxt.lineTo(centerX-facing*box.width*0.34,centerY+box.height*0.08);
        }
        else if (armor.style=="tank" || armor.style=="battlecruiser") {
            cxt.moveTo(centerX-box.width*0.28,centerY-box.height*0.22);
            cxt.lineTo(centerX-box.width*0.42,centerY-box.height*0.34);
            cxt.moveTo(centerX+box.width*0.28,centerY-box.height*0.22);
            cxt.lineTo(centerX+box.width*0.42,centerY-box.height*0.34);
        }
        else if (armor.style=="zealot" || armor.style=="stalker" || armor.style=="carrier") {
            cxt.moveTo(centerX-box.width*0.08,centerY-box.height*0.24);
            cxt.lineTo(centerX-box.width*0.24,centerY-box.height*0.46);
            cxt.moveTo(centerX+box.width*0.08,centerY-box.height*0.24);
            cxt.lineTo(centerX+box.width*0.24,centerY-box.height*0.46);
        }
        else {
            cxt.moveTo(centerX-box.width*0.18,centerY-box.height*0.22);
            cxt.lineTo(centerX-box.width*0.3,centerY-box.height*0.36);
            cxt.moveTo(centerX+box.width*0.18,centerY-box.height*0.22);
            cxt.lineTo(centerX+box.width*0.3,centerY-box.height*0.36);
        }
        cxt.stroke();

        if (armor.style=="tank" || armor.style=="battlecruiser" || armor.style=="carrier") {
            cxt.fillStyle=armor.plate;
            cxt.beginPath();
            cxt.roundRect(centerX-box.width*0.38,centerY+box.height*0.1,box.width*0.76,box.height*0.18,8);
            cxt.fill();
            cxt.stroke();
        }

        if (armor.style=="archon" || armor.style=="xelnaga") {
            cxt.fillStyle="rgba(138,220,255,0.35)";
            cxt.beginPath();
            cxt.arc(centerX,centerY-box.height*0.02,box.width*0.4,0,Math.PI*2);
            cxt.fill();
        }

        if (armor.style=="zealot") {
            cxt.strokeStyle="#59ecff";
            cxt.lineWidth=5;
            cxt.beginPath();
            cxt.moveTo(centerX-box.width*0.34,centerY-box.height*0.06);
            cxt.lineTo(centerX-box.width*0.5,centerY-box.height*0.32);
            cxt.moveTo(centerX+box.width*0.34,centerY-box.height*0.06);
            cxt.lineTo(centerX+box.width*0.5,centerY-box.height*0.32);
            cxt.stroke();
        }

        cxt.restore();
    },
    drawUnitSprite:function(cxt,imgSrc,chara,charaX,charaY){
        if (Game.shouldDrawBunnyMount(chara)) {
            if (Game.drawBunnyAtlasSprite(cxt,chara)) return;
            Game.drawMountedArmor(cxt,chara,charaX,charaY);
            return;
        }
        var spriteBox={
            x:charaX,
            y:charaY,
            width:chara.width,
            height:chara.height
        };
        //Same image in different directions
        if (chara.direction==undefined){
            var _left=chara.imgPos[chara.status].left;
            var _top=chara.imgPos[chara.status].top;
            //Multiple actions status
            if (_left instanceof Array || _top instanceof Array){
                cxt.drawImage(imgSrc,
                    _left[chara.action],_top[chara.action],chara.width,chara.height,
                    spriteBox.x,spriteBox.y,spriteBox.width,spriteBox.height);
            }
            //One action status
            else{
                cxt.drawImage(imgSrc,
                    _left,_top,chara.width,chara.height,
                    spriteBox.x,spriteBox.y,spriteBox.width,spriteBox.height);
            }
        }
        //Different image in different directions
        else{
            var _left=chara.imgPos[chara.status].left[chara.direction];
            var _top=chara.imgPos[chara.status].top[chara.direction];
            //Multiple actions status
            if (_left instanceof Array || _top instanceof Array){
                cxt.drawImage(imgSrc,
                    _left[chara.action],_top[chara.action],chara.width,chara.height,
                    spriteBox.x,spriteBox.y,spriteBox.width,spriteBox.height);
            }
            //One action status
            else{
                cxt.drawImage(imgSrc,
                    _left,_top,chara.width,chara.height,
                    spriteBox.x,spriteBox.y,spriteBox.width,spriteBox.height);
            }
        }
    },
    init:function(){
        document.title=Game.title;
        //Prevent full select
        $('div.GameLayer').on("selectstart",function(event){
            event.preventDefault();
        });
        //Bind resize canvas handler
        window.onresize=Game.resizeWindow;
        /*window.requestAnimationFrame=requestAnimationFrame || webkitRequestAnimationFrame
         || mozRequestAnimationFrame || msRequestAnimationFrame || oRequestAnimationFrame;//Old browser compatible*/
        //Start loading
        Game.layerSwitchTo("GameLoading");
        //Zerg
        sourceLoader.load("img","img/Charas/Mutalisk.png","Mutalisk");
        sourceLoader.load("img","img/Charas/Devourer.png","Devourer");
        sourceLoader.load("img","img/Charas/Guardian.png","Guardian");
        sourceLoader.load("img","img/Charas/Overlord.png","Overlord");
        sourceLoader.load("img","img/Charas/Drone.png","Drone");
        sourceLoader.load("img","img/Charas/Zergling.png","Zergling");
        sourceLoader.load("img","img/Charas/Hydralisk.png","Hydralisk");
        sourceLoader.load("img","img/Charas/Scourge.png","Scourge");
        sourceLoader.load("img","img/Charas/Lurker.png","Lurker");
        sourceLoader.load("img","img/Charas/Ultralisk.png","Ultralisk");
        sourceLoader.load("img","img/Charas/Broodling.png","Broodling");
        sourceLoader.load("img","img/Charas/InfestedTerran.png","InfestedTerran");
        sourceLoader.load("img","img/Charas/Queen.png","Queen");
        sourceLoader.load("img","img/Charas/Defiler.png","Defiler");
        sourceLoader.load("img","img/Charas/Larva.png","Larva");
        //Terran
        sourceLoader.load("img","img/Charas/BattleCruiser.png","BattleCruiser");
        sourceLoader.load("img","img/Charas/Wraith.png","Wraith");
        sourceLoader.load("img","img/Charas/SCV.png","SCV");
        sourceLoader.load("img","img/Charas/Civilian.png","Civilian");
        sourceLoader.load("img","img/Charas/Marine.png","Marine");
        sourceLoader.load("img","img/Charas/Firebat.png","Firebat");
        sourceLoader.load("img","img/Charas/Ghost.png","Ghost");
        sourceLoader.load("img","img/Charas/Vulture.png","Vulture");
        sourceLoader.load("img","img/Charas/Tank.png","Tank");
        sourceLoader.load("img","img/Charas/Goliath.png","Goliath");
        sourceLoader.load("img","img/Charas/Medic.png","Medic");
        sourceLoader.load("img","img/Charas/Dropship.png","Dropship");
        sourceLoader.load("img","img/Charas/Vessel.png","Vessel");
        sourceLoader.load("img","img/Charas/Valkyrie.png","Valkyrie");
        //Protoss
        sourceLoader.load("img","img/Charas/Probe.png","Probe");
        sourceLoader.load("img","img/Charas/Zealot.png","Zealot");
        sourceLoader.load("img","img/Charas/Dragoon.png","Dragoon");
        sourceLoader.load("img","img/Charas/Templar.png","Templar");
        sourceLoader.load("img","img/Charas/DarkTemplar.png","DarkTemplar");
        sourceLoader.load("img","img/Charas/Reaver.png","Reaver");
        sourceLoader.load("img","img/Charas/Archon.png","Archon");
        sourceLoader.load("img","img/Charas/DarkArchon.png","DarkArchon");
        sourceLoader.load("img","img/Charas/Shuttle.png","Shuttle");
        sourceLoader.load("img","img/Charas/Observer.png","Observer");
        sourceLoader.load("img","img/Charas/Arbiter.png","Arbiter");
        sourceLoader.load("img","img/Charas/Scout.png","Scout");
        sourceLoader.load("img","img/Charas/Carrier.png","Carrier");
        sourceLoader.load("img","img/Charas/Corsair.png","Corsair");
        //Neuture
        sourceLoader.load("img","img/Charas/Ragnasaur.png","Ragnasaur");
        sourceLoader.load("img","img/Charas/Rhynsdon.png","Rhynsdon");
        sourceLoader.load("img","img/Charas/Ursadon.png","Ursadon");
        sourceLoader.load("img","img/Charas/Bengalaas.png","Bengalaas");
        sourceLoader.load("img","img/Charas/Scantid.png","Scantid");
        sourceLoader.load("img","img/Charas/Kakaru.png","Kakaru");
        //Hero
        sourceLoader.load("img","img/Charas/HeroCruiser.png","HeroCruiser");
        sourceLoader.load("img","img/Charas/Sarah.png","Sarah");
        sourceLoader.load("img","img/Charas/Kerrigan.png","Kerrigan");
        //Building
        sourceLoader.load("img","img/Charas/ZergBuilding.png","ZergBuilding");
        sourceLoader.load("img","img/Charas/TerranBuilding.png","TerranBuilding");
        sourceLoader.load("img","img/Charas/ProtossBuilding.png","ProtossBuilding");
        /*sourceLoader.load("audio","bgm/PointError.wav","PointError");*/
        //Map
        sourceLoader.load("img","img/Maps/(2)Switchback.jpg","Map_Switchback");
        sourceLoader.load("img","img/Maps/(2)Volcanis.jpg","Map_Volcanis");
        sourceLoader.load("img","img/Maps/(3)Trench wars.jpg","Map_TrenchWars");
        sourceLoader.load("img","img/Maps/(4)Blood Bath.jpg","Map_BloodBath");
        sourceLoader.load("img","img/Maps/(4)Orbital Relay.jpg","Map_OrbitalRelay");
        sourceLoader.load("img","img/Maps/(6)Thin Ice.jpg","Map_ThinIce");
        sourceLoader.load("img","img/Maps/(8)BigGameHunters.jpg","Map_BigGameHunters");
        sourceLoader.load("img","img/Maps/(8)TheHunters.jpg","Map_TheHunters");
        sourceLoader.load("img","img/Maps/(8)Turbo.jpg","Map_Turbo");
        sourceLoader.load("img","img/Maps/Map_Grass.jpg","Map_Grass");
        sourceLoader.load("img","img/Charas/Mud.png","Mud");
        //Extra
        sourceLoader.load("img","img/Charas/Burst.png","Burst");
        sourceLoader.load("img","img/Charas/BuildingBurst.png","BuildingBurst");
        sourceLoader.load("img","img/Charas/Portrait.png","Portrait");
        sourceLoader.load("img","img/Charas/Magic.png","Magic");
        sourceLoader.load("img","img/Menu/ControlPanel.png","ControlPanel");
        sourceLoader.load("img","img/Bg/GameStart.jpg","GameStart");
        sourceLoader.load("img","img/Bg/GamePlay.jpg","GamePlay");
        sourceLoader.load("img","img/Bg/GameWin.jpg","GameWin");
        sourceLoader.load("img","img/Bg/GameLose.jpg","GameLose");
        sourceLoader.load("img","img/Bunny/bunnycrap_char.png","BunnyAtlas");

        sourceLoader.allOnLoad(function(){
            $('#GameStart').prepend(sourceLoader.sources['GameStart']);
            //$('#GamePlay').prepend(sourceLoader.sources['GamePlay']);
            $('#GameWin').prepend(sourceLoader.sources['GameWin']);
            $('#GameLose').prepend(sourceLoader.sources['GameLose']);
            $('#GamePlay>canvas').attr('width',Game.HBOUND);//Canvas width adjust
            $('#GamePlay>canvas').attr('height',Game.VBOUND);//Canvas height adjust
            for (var N=1;N<=9;N++){
                $('div.panel_Control').append("<button num='"+N+"'></button>");
            }
            /*//Test image effect
            AlloyImage(sourceLoader.sources['Wraith']).act("setHSI",100,0,0,false).replace(sourceLoader.sources['Wraith']);
            AlloyImage(sourceLoader.sources['BattleCruiser']).act("setHSI",100,0,0,false).replace(sourceLoader.sources['BattleCruiser']);*/
            Game.start();
        })
    },
    start:function(){
        //Game start
        Game.layerSwitchTo("GameStart");
        $('.LoadingMsg').text('Bunny mounts ready.');
        //Init level selector
        for (var level=1; level<=Levels.length; level++){
            $('.levelSelectionBg').append("<div class='levelItem'>" +
                "<input type='radio' value='"+level+"' name='levelSelect'>"+
                (Levels[level-1].label?(Levels[level-1].label):("Level "+level))
                +"</input></div>");
        }
        //Wait for user select level and play game
        $('input[name="levelSelect"]').click(function(){
            Game.level=this.value;
            Game.play();
        });
    },
    play:function(){
        Resource.init();
        //Load level
        Levels[Game.level-1].load();//callback
        //Wait for unit and building initialize
        setTimeout(function(){
            //Game background
            Game.layerSwitchTo("GamePlay");
            Game.resizeWindow();
            //Bind controller
            mouseController.toControlAll();//Can control all units
            keyController.start();//Start monitor
            Game.animation();
        },0);
    },
    addSelectedIntoTeam:function(teamNum){
        //Build a new team
        Game.teams[teamNum]=_$.mixin([],Game.allSelected);
    },
    callTeam:function(teamNum){
        var team=_$.mixin([],Game.teams[teamNum]);
        //When team already exist
        if (team instanceof Array){
            Game.unselectAll();
            //GC
            $.extend([],team).forEach(function(chara){
                if (chara.status=='dead') team.splice(team.indexOf(chara),1);
            });
            Game.addIntoAllSelected(team,true);
            if (team[0] instanceof Gobj){
                Game.changeSelectedTo(team[0]);
                //Sound effect
                team[0].sound.selected.play();
                //Relocate map center
                Map.relocateAt(team[0].posX(),team[0].posY());
            }
        }
    },
    unselectAll:function(){
        //Unselect all
        var units=Unit.allUnits.concat(Building.allBuildings);
        units.forEach(function(chara){chara.selected=false});
        Game.addIntoAllSelected([],true);
    },
    multiSelectInRect:function(){
        Game.unselectAll();
        //Multi select in rect
        var startPoint={x:Map.offsetX+Math.min(mouseController.startPoint.x,mouseController.endPoint.x),
            y:Map.offsetY+Math.min(mouseController.startPoint.y,mouseController.endPoint.y)};
        var endPoint={x:Map.offsetX+Math.max(mouseController.startPoint.x,mouseController.endPoint.x),
            y:Map.offsetY+Math.max(mouseController.startPoint.y,mouseController.endPoint.y)};
        var inRectUnits=Unit.allOurUnits().filter(function(chara){
            return chara.insideRect({start:(startPoint),end:(endPoint)})
        });
        if (inRectUnits.length>0) Game.changeSelectedTo(inRectUnits[0]);
        else Game.changeSelectedTo({});
        Game.addIntoAllSelected(inRectUnits,true);
    },
    getSelectedOne:function(clickX,clickY,isEnemyFilter,unitBuildingFilter,isFlyingFilter,customFilter){
        var distance=function(chara){
            return (clickX-chara.posX())*(clickX-chara.posX())+(clickY-chara.posY())*(clickY-chara.posY());//Math.pow2
        };
        //Initial
        var selectedOne={},charas=[];
        if (isEnemyFilter==null){
            if (unitBuildingFilter==null) charas=Unit.allUnits.concat(Building.allBuildings);
            else if (unitBuildingFilter) charas=Unit.allUnits;
            else charas=Building.allBuildings;
        }
        else if (isEnemyFilter){
            if (unitBuildingFilter==null) charas=Unit.allEnemyUnits().concat(Building.enemyBuildings);
            else if (unitBuildingFilter) charas=Unit.allEnemyUnits();
            else charas=Building.enemyBuildings;
        }
        else {
            if (unitBuildingFilter==null) charas=Unit.allOurUnits().concat(Building.ourBuildings);
            else if (unitBuildingFilter) charas=Unit.allOurUnits();
            else charas=Building.ourBuildings;
        }
        if (isFlyingFilter!=null) {
            charas=charas.filter(function(chara){
                return chara.isFlying==isFlyingFilter;
            });
        }
        //customFilter is filter function
        if (customFilter!=null){
            charas=charas.filter(customFilter);
        }
        //Find nearest one
        selectedOne=charas.filter(function(chara){
            return chara.status!='dead' && chara.includePoint(clickX,clickY);
        }).sort(function(chara1,chara2){
            return distance(chara1)-distance(chara2);
        })[0];
        if (!selectedOne) selectedOne={};
        return selectedOne;
    },
    getInRangeOnes:function(clickX,clickY,range,isEnemyFilter,unitBuildingFilter,isFlyingFilter,customFilter){
        //Initial
        var selectedOnes=[],charas=[];
        if (isEnemyFilter==null){
            if (unitBuildingFilter==null) charas=Unit.allUnits.concat(Building.allBuildings);
            else if (unitBuildingFilter) charas=Unit.allUnits;
            else charas=Building.allBuildings;
        }
        else if (isEnemyFilter){
            if (unitBuildingFilter==null) charas=Unit.allEnemyUnits().concat(Building.enemyBuildings);
            else if (unitBuildingFilter) charas=Unit.allEnemyUnits();
            else charas=Building.enemyBuildings;
        }
        else {
            if (unitBuildingFilter==null) charas=Unit.allOurUnits().concat(Building.ourBuildings);
            else if (unitBuildingFilter) charas=Unit.allOurUnits();
            else charas=Building.ourBuildings;
        }
        if (isFlyingFilter!=null) {
            charas=charas.filter(function(chara){
                return chara.isFlying==isFlyingFilter;
            });
        }
        //customFilter is filter function
        if (customFilter!=null){
            charas=charas.filter(customFilter);
        }
        //Find in range ones
        selectedOnes=charas.filter(function(chara){
            return chara.status!='dead' && chara.insideSquare({centerX:clickX,centerY:clickY,radius:range});
        });
        return selectedOnes;
    },
    //For test use
    getSelected:function(){
        return Unit.allUnits.concat(Building.allBuildings).filter(function(chara){
            return chara.selected;
        });
    },
    //Sort units from nearest to far away
    getNearbyOnes:function(clickX,clickY,isEnemyFilter){
        //Initial
        var units=[];
        //No filter, all units
        if (isEnemyFilter==undefined) units=Unit.allUnits.concat(Building.allBuildings);//_$.copy(Unit.allUnits)
        else {
            //Only enemy units
            if (isEnemyFilter) units=Unit.allEnemyUnits().concat(Building.enemyBuildings);//_$.copy(Unit.allEnemyUnits())
            //Only our units
            else units=Unit.allOurUnits().concat(Building.ourBuildings);//_$.copy(Unit.allOurUnits())
        }
        units.sort(function(unit1,unit2){
            return (unit1.posX()-clickX)*(unit1.posX()-clickX)+(unit1.posY()-clickY)*(unit1.posY()-clickY)
                -(unit2.posX()-clickX)*(unit2.posX()-clickX)-(unit2.posY()-clickY)*(unit2.posY()-clickY);
        });
        return units;
    },
    getNearestOne:function(clickX,clickY,isEnemyFilter){
        return Game.getNearbyOnes(clickX,clickY,isEnemyFilter)[0];
    },
    changeSelectedTo:function(chara){
        Game.selectedUnit=chara;
        Button.equipButtonsFor(chara);
        if (chara instanceof Gobj){
            chara.selected=true;
        }
        //Show selected living unit info
        if (Game.selectedUnit instanceof Gobj && Game.selectedUnit.status!="dead") {
            //Display info
            $('div.panel_Info>div[class*="info"]').show();
            //Draw selected unit portrait
            if (chara.portrait) $('div.infoLeft div[name="portrait"]')[0].className=chara.portrait;//Override portrait
            else {
                if (Game.selectedUnit instanceof Unit)
                    $('div.infoLeft div[name="portrait"]')[0].className=Game.selectedUnit.name;
                if (Game.selectedUnit instanceof Building)
                    $('div.infoLeft div[name="portrait"]')[0].className=
                        Game.selectedUnit.attack?Game.selectedUnit.inherited.inherited.name:Game.selectedUnit.inherited.name;
            }
            //Show selected unit HP,SP and MP
            $('div.infoLeft span._Health')[0].style.color=Game.selectedUnit.lifeStatus();
            $('div.infoLeft span.life')[0].innerHTML=Game.selectedUnit.life>>0;
            $('div.infoLeft span.HP')[0].innerHTML=Game.selectedUnit.get('HP');
            if (Game.selectedUnit.SP) {
                $('div.infoLeft span.shield')[0].innerHTML=Game.selectedUnit.shield>>0;
                $('div.infoLeft span.SP')[0].innerHTML=Game.selectedUnit.get('SP');
                $('div.infoLeft span._Shield').show();
            }
            else {
                $('div.infoLeft span._Shield').hide();
            }
            if (Game.selectedUnit.MP) {
                $('div.infoLeft span.magic')[0].innerHTML=Game.selectedUnit.magic>>0;
                $('div.infoLeft span.MP')[0].innerHTML=Game.selectedUnit.get('MP');
                $('div.infoLeft span._Magic').show();
            }
            else {
                $('div.infoLeft span._Magic').hide();
            }
            //Draw selected unit name,kill,damage,armor and shield
            $('div.infoCenter h3.name')[0].innerHTML=Game.selectedUnit.name;
            if (Game.selectedUnit.detector) {
                $('div.infoCenter p.detector').show();
            }
            else {
                $('div.infoCenter p.detector').hide();
            }
            if (Game.selectedUnit.attack){
                $('div.infoCenter p.kill span')[0].innerHTML=Game.selectedUnit.kill;
                if (Game.selectedUnit.attackMode) {
                    $('div.infoCenter p.damage span')[0].innerHTML=(Game.selectedUnit.get('attackMode.ground.damage')+'/'+Game.selectedUnit.get('attackMode.flying.damage'));
                }
                else {
                    $('div.infoCenter p.damage span')[0].innerHTML=(Game.selectedUnit.get('damage')+(Game.selectedUnit.suicide?' (1)':''));
                }
                //Show kill and damage
                $('div.infoCenter p.kill').show();
                $('div.infoCenter p.damage').show();
            }
            else {
                //Hide kill and damage
                $('div.infoCenter p.kill').hide();
                $('div.infoCenter p.damage').hide();
            }
            $('div.infoCenter p.armor span')[0].innerHTML=Game.selectedUnit.get('armor');
            if (Game.selectedUnit.get('plasma')!=undefined) {
                $('div.infoCenter p.plasma span')[0].innerHTML=Game.selectedUnit.get('plasma');
                $('div.infoCenter p.plasma').show();
            }
            else {
                $('div.infoCenter p.plasma').hide();
            }
            //Draw upgraded
            var upgraded=Game.selectedUnit.upgrade;
            var team=Number(Boolean(Game.selectedUnit.isEnemy));
            if (upgraded){
                for (var N=0;N<3;N++){
                    var upgradeIcon=$('div.upgraded div[name="icon"]')[N];
                    upgradeIcon.innerHTML='';
                    upgradeIcon.style.display='none';
                    if (N<upgraded.length){
                        upgradeIcon.className=upgradeIcon.title=upgraded[N];
                        upgradeIcon.innerHTML=Upgrade[upgraded[N]].level[team];
                        if (Upgrade[upgraded[N]].level[team]){
                            upgradeIcon.setAttribute('disabled','false');
                            upgradeIcon.style.color='aqua';
                        }
                        else {
                            upgradeIcon.setAttribute('disabled','true');
                            upgradeIcon.style.color='red';
                        }
                        upgradeIcon.style.display='inline-block';
                    }
                }
                $('div.upgraded').show();
            }
            else {
                //$('div.upgraded div[name="icon"]').html('').removeAttr('title').hide();
                $('div.upgraded').hide();
            }
        }
        else {
            //Hide info
            $('div.panel_Info>div').hide();
        }
    },
    draw:function(chara){
        //Can draw units and no-rotate bullets
        if (!(chara instanceof Gobj)) return;//Will only show Gobj
        if (chara.status=="dead") return;//Will not show dead
        //Won't draw units outside screen
        if (!chara.insideScreen()) return;
        //Choose context
        var cxt=((chara instanceof Unit) || (chara instanceof Building))?Game.cxt:Game.frontCxt;
        //Draw shadow
        cxt.save();
        //cxt.shadowBlur=50;//Different blur level on Firefox and Chrome, bad performance
        cxt.shadowOffsetX=(chara.isFlying)?5:3;
        cxt.shadowOffsetY=(chara.isFlying)?20:8;
        cxt.shadowColor="rgba(0,0,0,0.4)";
        //Close shadow for burrowed
        if (chara.buffer.Burrow) cxt.shadowOffsetX=cxt.shadowOffsetY=0;
        //Draw invisible
        if (chara.isInvisible!=undefined){
            cxt.globalAlpha=(chara.isEnemy && chara.isInvisible)?0:0.5;
            if (chara.burrowBuffer && !chara.isEnemy) cxt.globalAlpha=1;
        }
        //Draw unit or building
        var imgSrc;
        if (chara instanceof Building){
            if (chara.source) imgSrc=sourceLoader.sources[chara.source];
            else {
                imgSrc=sourceLoader.sources[chara.attack?chara.inherited.inherited.name:chara.inherited.name];
            }
        }
        //Unit, not building
        else imgSrc=sourceLoader.sources[chara.source?chara.source:chara.name];
        //Convert position
        var charaX=(chara.x-Map.offsetX)>>0;
        var charaY=(chara.y-Map.offsetY)>>0;
        Game.drawUnitSprite(cxt,imgSrc,chara,charaX,charaY);
        //Remove shadow
        cxt.restore();
        //Draw HP if has selected and is true
        if (chara.selected==true){
            cxt=Game.frontCxt;
            //Draw selected circle
            cxt.strokeStyle=(chara.isEnemy)?"red":"green";//Distinguish enemy
            cxt.lineWidth=2;//Cannot see 1px width circle clearly
            cxt.beginPath();
            cxt.arc(chara.posX()-Map.offsetX,chara.posY()-Map.offsetY,chara.radius(),0,2*Math.PI);
            cxt.stroke();
            //Draw HP bar and SP bar and magic bar
            cxt.globalAlpha=1;
            cxt.lineWidth=1;
            var offsetY=-6-(chara.MP?5:0)-(chara.SP?5:0);
            var lifeRatio=chara.life/chara.get('HP');
            cxt.strokeStyle="black";
            if (chara.SP) {
                //Draw HP and SP
                cxt.fillStyle="blue";
                cxt.fillRect(chara.x-Map.offsetX,chara.y-Map.offsetY+offsetY,chara.width*chara.shield/chara.get('SP'),5);
                cxt.strokeRect(chara.x-Map.offsetX,chara.y-Map.offsetY+offsetY,chara.width,5);
                cxt.fillStyle=(lifeRatio>0.7)?"green":(lifeRatio>0.3)?"yellow":"red";//Distinguish life
                cxt.fillRect(chara.x-Map.offsetX,chara.y-Map.offsetY+offsetY+5,chara.width*lifeRatio,5);
                cxt.strokeRect(chara.x-Map.offsetX,chara.y-Map.offsetY+offsetY+5,chara.width,5);
            }
            else {
                //Only draw HP
                cxt.fillStyle=(lifeRatio>0.7)?"green":(lifeRatio>0.3)?"yellow":"red";//Distinguish life
                cxt.fillRect(chara.x-Map.offsetX,chara.y-Map.offsetY+offsetY,chara.width*lifeRatio,5);
                cxt.strokeRect(chara.x-Map.offsetX,chara.y-Map.offsetY+offsetY,chara.width,5);
            }
            if (chara.MP) {
                //Draw MP
                cxt.fillStyle="darkviolet";
                cxt.fillRect(chara.x-Map.offsetX,chara.y-Map.offsetY+offsetY+(chara.SP?10:5),chara.width*chara.magic/chara.get('MP'),5);
                cxt.strokeRect(chara.x-Map.offsetX,chara.y-Map.offsetY+offsetY+(chara.SP?10:5),chara.width,5);
            }
        }
    },
    drawEffect:function(chara){
        //Can draw units and no-rotate bullets
        if (!(chara instanceof Burst)) return;//Will only show Burst
        if (chara.status=="dead") return;//Will not show dead
        //Won't draw units outside screen
        if (!chara.insideScreen()) return;
        //Choose context
        var cxt=Game.frontCxt;
        //Draw shadow
        cxt.save();
        //cxt.shadowBlur=50;//Different blur level on Firefox and Chrome, bad performance
        cxt.shadowOffsetX=(chara.isFlying)?5:3;
        cxt.shadowOffsetY=(chara.isFlying)?20:8;
        cxt.shadowColor="rgba(0,0,0,0.4)";
        var imgSrc=sourceLoader.sources[chara.name];
        //Convert position
        var charaX=(chara.x-Map.offsetX)>>0;
        var charaY=(chara.y-Map.offsetY)>>0;
        var _left=chara.imgPos[chara.status].left;
        var _top=chara.imgPos[chara.status].top;
        //Will stretch effect if scale
        var times=chara.scale?chara.scale:1;
        //Multiple actions status
        if (_left instanceof Array || _top instanceof Array){
            cxt.drawImage(imgSrc,
                _left[chara.action],_top[chara.action],chara.width,chara.height,
                charaX,charaY,chara.width*times>>0,chara.height*times>>0);
        }
        //One action status
        else{
            cxt.drawImage(imgSrc,
                _left,_top,chara.width,chara.height,
                charaX,charaY,chara.width*times>>0,chara.height*times>>0);
        }
        //Remove shadow
        cxt.restore();
    },
    drawBullet:function(chara){
        //Bullet array
        if (chara instanceof Array) {
            chara.forEach(function(bullet){
                Game.drawBullet(bullet);
            });
        }
        //Can draw bullets need rotate
        if (!(chara instanceof Bullets)) return;//Will only show bullet
        if (chara.status=="dead") return;//Will not show dead
        //Won't draw bullets outside screen
        if (!chara.insideScreen()) return;
        //Draw unit
        var imgSrc=sourceLoader.sources[chara.name];
        var _left=chara.imgPos[chara.status].left;
        var _top=chara.imgPos[chara.status].top;
        //Convert position
        var centerX=(chara.posX()-Map.offsetX)>>0;
        var centerY=(chara.posY()-Map.offsetY)>>0;
        //Rotate canvas
        Game.frontCxt.save();
        //Rotate to draw bullet
        Game.frontCxt.translate(centerX,centerY);
        Game.frontCxt.rotate(-chara.angle);
        //Draw shadow
        //Game.frontCxt.shadowBlur=50;//Different blur level on Firefox and Chrome, bad performance
        Game.frontCxt.shadowOffsetX=(chara.owner.isFlying)?5:3;
        Game.frontCxt.shadowOffsetY=(chara.owner.isFlying)?20:5;
        Game.frontCxt.shadowColor="rgba(0,0,0,0.4)";
        //Game.frontCxt.shadowColor="rgba(255,0,0,1)";
        //Multiple actions status
        if (_left instanceof Array || _top instanceof Array){
            Game.frontCxt.drawImage(imgSrc,
                _left[chara.action],_top[chara.action],chara.width,chara.height,
                -chara.width/2>>0,-chara.height/2>>0,chara.width,chara.height);
        }
        //One action status
        else{
            Game.frontCxt.drawImage(imgSrc,
                _left,_top,chara.width,chara.height,
                -chara.width/2>>0,-chara.height/2>>0,chara.width,chara.height);
        }
        //Rotate canvas back and remove shadow
        Game.frontCxt.restore();
        //Below 2 separated steps might cause mess
        //Game.frontCxt.translate(-centerX,-centerY);
        //Game.frontCxt.rotate(chara.angle);
    },
    drawInfoBox:function(){
        //Update selected unit active info which need refresh
        if (Game.selectedUnit instanceof Gobj && Game.selectedUnit.status!="dead") {
            //Update selected unit life,shield and magic
            var lifeRatio=Game.selectedUnit.life/Game.selectedUnit.get('HP');
            $('div.infoLeft span._Health')[0].style.color=((lifeRatio>0.7)?"green":(lifeRatio>0.3)?"yellow":"red");
            $('div.infoLeft span.life')[0].innerHTML=Game.selectedUnit.life>>0;
            if (Game.selectedUnit.SP) {
                $('div.infoLeft span.shield')[0].innerHTML=Game.selectedUnit.shield>>0;
            }
            if (Game.selectedUnit.MP) {
                $('div.infoLeft span.magic')[0].innerHTML=Game.selectedUnit.magic>>0;
            }
            //Update selected unit kill
            if (Game.selectedUnit.kill!=null){
                $('div.infoCenter p.kill span')[0].innerHTML=Game.selectedUnit.kill;
            }
        }
    },
    drawSourceBox:function(){
        //Update min, gas, curMan and totalMan
        $('div.resource_Box span.mineNum')[0].innerHTML=Resource[0].mine;
        $('div.resource_Box span.gasNum')[0].innerHTML=Resource[0].gas;
        $('div.resource_Box span.manNum>span')[0].innerHTML=Resource[0].curMan;
        $('div.resource_Box span.manNum>span')[1].innerHTML=Resource[0].totalMan;
        //Check if man overflow
        $('div.resource_Box span.manNum')[0].style.color=(Resource[0].curMan>Resource[0].totalMan)?"red":"#00ff00";
    },
    drawProcessingBox:function(){
        //Show processing box if it's processing
        var processing=Game.selectedUnit.processing;
        if (processing){
            $('div.upgrading div[name="icon"]')[0].className=processing.name;
            var percent=((new Date().getTime()-processing.startTime)/(processing.time)+0.5)>>0;
            //var percent=((Game._clock-processing.startTime)*100/(processing.time)+0.5)>>0;
            $('div.upgrading div[name="processing"] span')[0].innerHTML=percent;
            $('div.upgrading div[name="processing"] div.processedBar')[0].style.width=percent+'%';
            $('div.upgrading').attr('title',processing.name).show();
            /*$('div.upgrading div[name="icon"]')[0].setAttribute('title',processing.name);
            $('div.upgrading')[0].style.display='block';*/
        }
        else {
            $('div.upgrading').removeAttr('title').hide();
            /*delete $('div.upgrading div[name="icon"]')[0].title;
            $('div.upgrading')[0].style.display='none';*/
        }
    },
    refreshMultiSelectBox:function(){
        var divs=$('div.override div.multiSelection div');
        //Only refresh border color on current multiSelect box
        for (var n=0;n<divs.length;n++){
            divs[n].style.borderColor=Game.allSelected[n].lifeStatus();
        }
    },
    drawMultiSelectBox:function(){
        //Clear old icons
        $('div.override div.multiSelection')[0].innerHTML='';
        //Redraw all icons
        Game.allSelected.forEach(function(chara,N){
            var node=document.createElement('div');
            node.setAttribute('name','portrait');
            //Override portrait
            if (chara.portrait) node.className=chara.portrait;
            else node.className=(chara instanceof Building)?(chara.attack?chara.inherited.inherited.name:chara.inherited.name):chara.name;
            node.title=chara.name;
            node.style.borderColor=chara.lifeStatus();
            node.onclick=function(){
                //Selection execute
                Game.unselectAll();
                Game.changeSelectedTo(chara);
                //Single selection mode
                $('div.override').hide();
                $('div.override div.multiSelection').hide();
            };
            $('div.override div.multiSelection')[0].appendChild(node);
        });
        var iconNum=$('div.override div.multiSelection div').length;
        //Adjust width if unit icon space overflow
        $('div.override div.multiSelection').css('width',(iconNum>12?Math.ceil(iconNum/2)*55:330)+'px');
        //Adjust background position after added into DOM, nth starts from 1st(no 0th)
        for (var n=1;n<=iconNum;n++){
            var bgPosition=$('div.override div.multiSelection div:nth-child('+n+')').css('background-position');
            bgPosition=bgPosition.split(' ').map(function(pos){
                return parseInt(pos)*0.75+'px';
            }).join(' ');
            $('div.override div.multiSelection div:nth-child('+n+')').css('background-position',bgPosition);
        }
    },
    animation:function(){
        var loop=function(){
            //Clear all canvas
            Game.cxt.clearRect(0,0,Game.HBOUND,Game.VBOUND);
            Game.frontCxt.clearRect(0,0,Game.HBOUND,Game.VBOUND);
            //Game.backCxt.clearRect(0,0,Game.HBOUND,Game.VBOUND);//Only clear when refresh map
            //Layer0: Refresh map if needed
            if (Map.needRefresh) {
                Map.refresh(Map.needRefresh);
                Map.needRefresh=false;
            }
            //Layer1: Show all buildings
            for (var N=0;N<Building.allBuildings.length;N++){
                var build=Building.allBuildings[N];
                //GC
                if (build.status=="dead") {
                    if (build.isEnemy) {
                        var index=$.inArray(build,Building.enemyBuildings);
                        Building.enemyBuildings.splice(index,(index==-1)?0:1);
                    }
                    else {
                        var index=$.inArray(build,Building.ourBuildings);
                        Building.ourBuildings.splice(index,(index==-1)?0:1);
                    }
                    Building.allBuildings.splice(N,1);
                    N--;//Next unit come to this position
                    continue;
                }
                //Draw
                Game.draw(build);
                //Attackable building has bullet
                if (build.bullet) {
                    Game.drawBullet(build.bullet);}
                //Add this makes attackable building intelligent for attack
                if (build.AI) build.AI();
            }
            //Layer2: Show all existed units
            for (var N=0;N<Unit.allUnits.length;N++){
                var chara=Unit.allUnits[N];
                //GC
                if (chara.status=="dead") {
                    if (chara.isFlying) {
                        if (chara.isEnemy) {
                            var index=$.inArray(chara,Unit.enemyFlyingUnits);
                            Unit.enemyFlyingUnits.splice(index,(index==-1)?0:1);
                        }
                        else {
                            var index=$.inArray(chara,Unit.ourFlyingUnits);
                            Unit.ourFlyingUnits.splice(index,(index==-1)?0:1);
                        }
                    }
                    else {
                        if (chara.isEnemy) {
                            var index=$.inArray(chara,Unit.enemyGroundUnits);
                            Unit.enemyGroundUnits.splice(index,(index==-1)?0:1);
                        }
                        else {
                            var index=$.inArray(chara,Unit.ourGroundUnits);
                            Unit.ourGroundUnits.splice(index,(index==-1)?0:1);
                        }
                    }
                    Unit.allUnits.splice(N,1);
                    N--;//Next unit come to this position
                    continue;
                }
                //Draw
                Game.draw(chara);
                //Attackable unit bullet or magic bullet
                if (chara.bullet) Game.drawBullet(chara.bullet);
                //Add this makes chara intelligent for attack
                if (chara.attack) chara.AI();
                //Judge reach destination
                Referee.judgeReachDestination(chara);
            }
            //Layer3: Draw effects above units
            for (var N=0;N<Burst.allEffects.length;N++){
                var effect=Burst.allEffects[N];
                //GC
                if (effect.status=="dead" || (effect.target && effect.target.status=="dead")) {
                    Burst.allEffects.splice(N,1);
                    N--;//Next unit come to this position
                    continue;
                }
                Game.drawEffect(effect);
            }
            //Layer4: Draw drag rect
            if (mouseController.drag) {
                Game.cxt.lineWidth=3;
                Game.cxt.strokeStyle="green";
                Game.cxt.strokeRect(mouseController.startPoint.x,mouseController.startPoint.y,
                    mouseController.endPoint.x-mouseController.startPoint.x,
                    mouseController.endPoint.y-mouseController.startPoint.y);
            }
            //LayerBottom: Draw info box and resource box
            Game.drawInfoBox();
            Game.drawSourceBox();
            Game.drawProcessingBox();
            //Release selected unit when unit died or is invisible enemy
            if (Game.selectedUnit.status=="dead" || (Game.selectedUnit.isInvisible && Game.selectedUnit.isEnemy)) {
                Game.selectedUnit.selected=false;
                Game.changeSelectedTo({});
            }
            //Mr.Referee will judge Arbiter's effect
            Referee.judgeArbiter();
            //Mr.Referee will judge detector: override Arbiter effect
            Referee.judgeDetect();
            //Adjust location for collision
            Referee.judgeCollision();
            //Mr.Referee will recover charas when needed
            Referee.judgeRecover();
            //Mr.Referee will kill die survivor
            Referee.judgeDying();
            //Update man data
            Referee.judgeMan();
            //Mr.Referee will help add larvas
            Referee.addLarva();
            //Mr.Referee will monitor mini map every 1 sec
            Referee.monitorMiniMap();
            //Mr.Referee will cover fogs on maps every 1 sec
            Referee.coverFog();
            //Mr.Referee will alter info box mode every 1 sec
            Referee.alterSelectionMode();
            //Mr.Referee will judge win/lose once each loop
            Referee.judgeWinLose();
            //Clock ticking
            Game._clock++;
        };
        Game._timer=setInterval(loop,Game._frameInterval);
    },
    stopAnimation:function(){
        clearInterval(Game._timer);
    },
    stop:function(charas){
        charas.forEach(function(chara){
            chara.stop();
        });
        Game.stopAnimation();
    },
    win:function(){
        Game.stop(Unit.allUnits);
        $('div#GamePlay').fadeOut(3000);
        setTimeout(function(){
            Game.layerSwitchTo("GameWin");
            //Sound effect
            new Audio('bgm/GameWin.wav').play();
        },3000);
    },
    lose:function(){
        Game.stop(Unit.allUnits);
        $('div#GamePlay').fadeOut(3000);
        setTimeout(function(){
            Game.layerSwitchTo("GameLose");
            //Sound effect
            new Audio('bgm/GameLose.wav').play();
        },3000);
    },
    showWarning:function(msg,interval){
        //Default interval
        if (!interval) interval=3000;
        //Show message for a period
        $('div.warning_Box').html(msg).show();
        //Hide message after a period
        setTimeout(function(){
            $('div.warning_Box').html('').hide();
        },interval);
    },
    showMessage:function(msg,interval){
        //Default interval
        if (!interval) interval=3000;
        //Show message for a period
        $('div.message_Box').html(msg).show();
        //Hide message after a period
        setTimeout(function(){
            $('div.message_Box').html('').hide();
        },interval);
    },
    resizeWindow:function(){
        //Update parameters
        Game.HBOUND=innerWidth;//$('body')[0].scrollWidth
        Game.VBOUND=innerHeight;//$('body')[0].scrollHeight
        Game.infoBox.width=Game.HBOUND-295;
        Game.infoBox.y=Game.VBOUND-110;
        //Resize canvas
        $('#GamePlay>canvas')[0].width=Game.HBOUND;
        $('#GamePlay>canvas')[0].height=Game.VBOUND;
        Map.fogCanvas.width=Game.HBOUND;
        Map.fogCanvas.height=Game.VBOUND-Game.infoBox.height+5;
        //Resize panel_Info
        $('div.panel_Info')[0].style.width=((Game.HBOUND-295)+'px');
        //Update map inside-stroke size
        Map.insideStroke.width=(130*Game.HBOUND/Map.getCurrentMap().width)>>0;
        Map.insideStroke.height=(130*Game.VBOUND/Map.getCurrentMap().height)>>0;
        //Redraw map
        Map.draw();
        //Need re-calculate fog immediately
        Map.refreshFog();
    }
};
