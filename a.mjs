
class Aoo {
  constructor() {
    console.log('这是父类');
  }
}
const origin = Aoo.prototype.constructor
Aoo.prototype.constructor=function(){
    origin()
    console.log(`=====`)
}
console.log(Aoo.prototype.constructor)
class B extends Aoo {
  constructor() {
    super()
    console.log('这是子类');
  }
}
const r = new B ()
console.log(r)