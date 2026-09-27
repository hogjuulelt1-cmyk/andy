import re,os
src=open('../chinbilig-tracker.html').read()
adapter=open('adapter.js').read()
def r(s,a,b,cnt=1):
    assert s.count(a)==cnt,(a[:80],s.count(a)); return s.replace(a,b)
i=src.index('<div class="wrap">')
head,body=src[:i],src[i:]
head=r(head,'<style>','<style>\n:root{padding-top:env(safe-area-inset-top,0px)}\nbody{margin:0}\nimg{max-width:100%}\n[hidden]{display:none!important}\n',1) if False else head.replace('<style>','<style>\n:root{padding-top:env(safe-area-inset-top,0px)}\nbody{margin:0}\nimg{max-width:100%}\n[hidden]{display:none!important}\ninput[type=email],input[type=password]{width:100%;background:var(--sunk);border:1px solid var(--line);border-radius:8px;padding:9px 10px;min-height:42px}\nbody.locked .icon-btn{display:none}',1)
body=r(body,'<script>\n(function(){','<script src="config.js"></script>\n<script>\n(function(){')
body=r(body,'async function initStore(){',adapter+'\nfunction fileHref(id){return (id||"").startsWith("f/")?(SB.fileUrl(id)||"#"):"#";}\nasync function initStoreArtifact(){')
body=r(body,'render();\ninitStore();','render();\nif(SB.configured()){SB.loadSession();if(SB.session)startCloud();else showLogin();}else initStoreArtifact();')
body=r(body,'if(mode==="cloud"){ if(data) await db.doc(path).set(clone(data)); else await db.doc(path).delete(); }','if(mode==="cloud"){ if(data) await SB.set(path,clone(data)); else await SB.del(path); }')
body=r(body,'.catch(e=>{delete dirty[path];setSync("err",e&&e.code==="invalid_argument"?"Хадгалах эрхгүй байна (Contributor/Editor эрх хэрэгтэй)":"Хадгалж чадсангүй. Дахин оролдоно уу.");});',
 '.catch(e=>{delete dirty[path];if(e&&e.message==="noauth"){showLogin("Дахин нэвтэрнэ үү.");return;}setSync("err","Хадгалж чадсангүй. Интернэтээ шалгана уу.");});')
body=r(body,"href=\"/_blob/'+esc(x.file.id)+'\"","href=\"'+esc(fileHref(x.file.id))+'\"")
body=r(body,"src=\"/_blob/'+esc(x.file.id)+'\"","src=\"'+esc(fileHref(x.file.id))+'\"")
body=r(body,"""'<button class="btn ghost" data-act="backup">Нөөц хуулбар татах (JSON)</button>':"")+"</div>";""",
 """'<button class="btn ghost" data-act="backup">Нөөц хуулбар татах (JSON)</button>':"")+(mode==="cloud"?'<div class="field"><label for="imp-file">Нөөц хуулбараас сэргээх (JSON)</label><input id="imp-file" type="file" accept="application/json,.json"></div><p class="small muted">Нэвтэрсэн: '+esc((SB.session&&SB.session.email)||"")+'</p><button class="btn ghost" data-act="logout">Гарах</button>':"")+"</div>";""")
body=r(body,'    case "backup":','    case "logout":SB.storeSession(null);location.reload();return;\n    case "backup":')
body=r(body,'document.addEventListener("input",onInput);','document.addEventListener("input",onInput);\ndocument.addEventListener("change",async e=>{if(e.target.id!=="imp-file"||!e.target.files[0])return;toast("Сэргээж байна…");try{const n=await importBackup(e.target.files[0]);toast(n+" бичлэг сэргээгдлээ");}catch(err){toast("Файлыг уншиж чадсангүй");}});')
out='<!doctype html>\n<html lang="mn">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="robots" content="noindex">\n'+head+'</head>\n<body>\n'+body+'\n</body>\n</html>\n'
os.makedirs('site',exist_ok=True)
open('site/index.html','w').write(out)
print(len(out))
