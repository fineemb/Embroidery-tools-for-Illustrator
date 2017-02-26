(function(){
  var document = app.activeDocument;//ドキュメント
  var selection = document.selection;//選択


var prevX;
var prevY;
var p;//ポイント
var p_length=0;
var embCode;//刺繍部分

var half_w;
var half_h;

var sel_width;
var sel_height;

var current_p;
var currentX;
var currentY;

var stich_point=0;
var color_change=0;

var l,t,r,b,min_l,min_t,max_r,max_b;


var RATIO=0.283464566929133;
$.write(selection);

for (var i=selection.length-1; i>=0; i--){
    p=selection[i].pathPoints;
    p_length	=	p.length;

    l=selection[i].controlBounds[0];
    t=-selection[i].controlBounds[1];
    r=selection[i].controlBounds[2];
    b=-selection[i].controlBounds[3];

    if(i==selection.length-1){
        min_l=l;
        min_t=t;
        max_r=r;
        max_b=b;
    }

    min_l=Math.min(l,min_l);
    min_t=Math.min(t,min_t);
    max_r=Math.max(r,max_r);
    max_b=Math.max(b,max_b);



    //実データ
    for(var j=0;j<p_length;j++){
        current_p=p[j].anchor;
        currentX=Math.round(current_p[0]/RATIO);
        currentY=Math.round(current_p[1]/RATIO);
        
        //$.write(prevX-currentX,",",prevY-currentY,"\n");
        writeBinary(prevX-currentX,prevY-currentY);
        
        prevX=currentX;
        prevY=currentY;
    }
    
    if(selection.length>1){
    	embCode += String.fromCharCode(0x0,0x0,0xC3);
        color_change++;
    }
    
}





/*======================================================

encode

======================================================*/

function writeBinary(moveX,moveY){
    //$.write(moveX,",",moveY,"\n");
    var b1=0x0;
    var b2=0x0;
    var b3=0x0;
    var mx=moveX;
    var my=moveY;

    var over_mx=0;
    var over_my=0;


    if(Math.abs(mx)>121 || Math.abs(my)>121){
    	if(mx<-121){
			over_mx=mx+121;
			mx=-121;
	    }else if(mx>121){
	    	over_mx=mx-121;
	    	mx=121;
	    };

	    if(my<-121){
	    	over_my=my+121;
	    	my=-121;
	    }else if(my>121){
	    	over_my=my-121;
	    	my=121;
	    };

	    b3|=0x80;

        //$.write(over_mx,over_my,"\n")
        //alert("範囲外");
        //return;
    }


//81-(27+9+3+1)=41
    if(mx>=41){
        b3 |= 0x8;//00000100
        mx-=81;
    }

    if(mx<=-41){
        b3 |= 0x4;//00001000
        mx+=81;
    }

    if(my>=41){
        b3 |= 0x10;//00100000
        my-=81;
    }

    if(my<=-41){
        b3 |= 0x20;//00010000
        my+=81;
    }

//27-(9+3+1)=14
    if(mx>=14){
        b2 |= 0x8;//00000100
        mx-=27;
    }

    if(mx<=-14){
        b2 |= 0x4;//00001000
        mx+=27;
    }

     if(my>=14){
        b2 |= 0x10;//00100000
        my-=27;
    }

    if(my<=-14){
        b2 |= 0x20;//00010000
        my+=27;
    }

//9-(3+1)=5
    if(mx>=5){
        b1 |= 0x8;//00000100
        mx-=9;
    }

    if(mx<=-5){
        b1 |= 0x4;//00001000
        mx+=9;
    }

    if(my>=5){
        b1 |= 0x10;//00100000
        my-=9;
    }

    if(my<=-5){
        b1 |= 0x20;//00010000
        my+=9;
    }

//3-(1)=2
    if(mx>=2){
        b2 |= 0x2;//00000001
        mx-=3;
    }

    if(mx<=-2){
        b2 |= 0x1;//00000010
        mx+=3;
    }

    if(my>=2){
        b2 |= 0x40;//10000000
        my-=3;
    }

    if(my<=-2){
        b2 |= 0x80;//01000000
        my+=3;
    }

//1
    if(mx>=1){
        b1 |= 0x2;//00000001
        mx-=1;
    }

    if(mx<=-1){
        b1 |= 0x1;//00000010
        mx+=1;
    }

    if(my>=1){
        b1 |= 0x40;//10000000
        my-=1;
    }

    if(my<=-1){
        b1 |= 0x80;//01000000
        my+=1;
    }

    b3 |= 0x3;//00000011

    // 3バイトのバイナリデータの生成
    //$.write("b1:",b1,"b2:",b2,"b3:",b3,"\n")
    if(embCode){embCode += String.fromCharCode(b1,b2,b3)}else{embCode = String.fromCharCode(b1,b2,b3)};   
    
    stich_point++;

    if(over_mx||over_my){
    	writeBinary(over_mx,over_my);
    }
}



/*

Byte 1  y+1     y-1     y+9     y-9     x-9     x+9     x-1     x+1
Byte 2  y+3     y-3     y+27    y-27    x-27    x+27    x-3     x+3
Byte 3  jump    color   y+81    y-81    x-81    x+81    set     set
*/


/*======================================================

write



======================================================*/
var nameArray = String(document.name).split(".");
var name
if(nameArray.length>1){
    name= nameArray.splice(0, nameArray.length-1).join(".");
}else{
    name=nameArray[0];
}

var outputPath = String(File(document.path).fsName).replace(/\\/g, "/" )+"/";


var outputFile = new File( outputPath+name+".dst");
outputFile=outputFile.saveDlg("Save DST");

if(!outputFile){return;}




sel_width   =   Math.round((max_r - min_l)/RATIO)//width
sel_height  =   Math.round((max_b - min_t)/RATIO);//height
    
half_w      =   Math.round(sel_width/2);//原点設定用??????とりあえず中心
half_h      =   Math.round(sel_height/2);



//header  
var str = "";
    str += "LA:  "        +   name;
    str += "\rST:  "		+	stich_point;		//総針数
    str += "\rCO:  "		+	color_change;
    str += "\r+X:  "		+	half_w;
    str += "\r-X:  "		+	half_w;
    str += "\r+Y:  "		+	half_h;
    str += "\r-Y:  "		+	half_h;
    str += "\rAX:+    "		+	0;
    str += "\rAY:+    "		+	0;
    str += "\rMX:+    "		+	0;
    str += "\rMY:+    "		+	0;
    str += "\rPD:"      +	"******"
    str += "\r";

//刺繍データーファイルは512バイト（アドレス200HEX）から00.00.**で始まります。
//空白
var blank_num=512-str.length;
for (var k=0;k<blank_num;k++){
	str +=" ";
}


outputFile.encoding="BINARY";
outputFile.open("w");//write
outputFile.write(str);

//start
var startCode=String.fromCharCode(0x00, 0x00, 0x83);//fix??
outputFile.write(startCode);

//刺繍
outputFile.write(embCode);

//end
var finishCode = String.fromCharCode(0x00, 0x00, 0xF3);//fix
outputFile.write(finishCode);
//書き込み終了
outputFile.close();





})();
