# polymorph.js
Stolen from [code.google.com/p/polymorph-js]()

Allows you to easily create polymorphic functions (functions which have the same name and differ in number of parameters or their types). 

This allows you to easily create polymorphic functions (functions which have the same name and differ in number of parameters or their types). JS itself doesn't support this, so you should manually check number of parameters and their types to perform different actions. This library makes things much easier, and your code will look better as function interfaces will be explicitly declared. You may also create polymorphic methods and constructors. The library might be helpful if you want to port Java/C++ code to JS without changes in interface or just get used to write polymorphic functions.

The only library function called 'polymorph' accepts bunch of subfunctions optionally prepended by Object, which describes parameter types. The return value of 'polymorph' function is an actual polymorphic function. If your subfunctions differ in number of parameters only, you may omit parameter types Object. You may also specify types for some parameters only, other ones will not be checked.

Simple example:

```js
var PolyFunc = polymorph(
        function(a,b,c) {
                return "Three arguments version -- any types";
        },
        
        {i: Number, str: String},
        function(i,str) {
                return "Number and string passed";
        },
        
        {re: RegExp},
        function(re,a) {
                return "RegExp and something else passed";
        },
        
        {f: Function, b: Boolean},
        function(f,b) {
                return "Function and boolean passed";
        },
        
        {f: Function, i: Number},
        function(f,i) {
                return "Function and number passed";
        }
);

alert(PolyFunc(1,2,3)); // "Three arguments version -- any types"
alert(PolyFunc(1,"qq")); // "Number and string passed"
alert(PolyFunc(function() {}, true)); // "Function and boolean passed"
alert(PolyFunc(function() {}, 1)); // "Function and number passed"
alert(PolyFunc(/a/, 1)); // "RegExp and something else passed"
alert(PolyFunc(/a/, "str")); // "RegExp and something else passed"
```

When you call the resulting function, it will try to find the most suitable subfunction to call. Note that for the sake of performance type checks are not strict: if types are not compatible with any subfunction, then last registered one with given arguments number will be called.

Created polymorphic function has two additional methods: update and inherit. The update method allows you to add more functions (probably replacing old ones), while the inherit method will create new polymorphic function (like clone+update).

```js
PolyFunc.update(
        {func: Function, n: Number},
        function(func, n) {
                return "New function-number function replaced old one";
        },
        
        function(a) {
                return "Single-parameter function";
        }
);
alert(PolyFunc(function() {}, 1)); // New function-number function replaced old one
alert(PolyFunc(function() {})); // Single-parameter function
```

Example of using polymorphic constructors and methods:

```js
/*
Simple object with polymorph constructor
Note that one constructor can call another
*/
var Point = polymorph(
        function() {
                this.constructor(0,0);
        },
        function(x,y) {
                this.x = x;
                this.y = y;
                this.toString = function() {return this.x+"; "+this.y;};
        }
);

/*
More complex polymorph constructor
*/
var Rectangle = polymorph(
        function(x1, y1, x2, y2) {
                this.x1 = x1;
                this.y1 = y1;
                this.x2 = x2;
                this.y2 = y2;
        },

        /*
        Two two-parameter constructors with different parameter types
        */
        {p1: Point, p2: Point},
        function(p1, p2) {
                this.constructor(p1.x, p1.y, p2.x, p2.y);
        },

        {x1: Number, y1: Number},
        function(x1, y1) {
                this.constructor(x1, y1, x1, y1);
        },

        function() {
                this.constructor(0, 0);
        }
);
Rectangle.prototype.toString = function() {return "("+this.x1+", "+this.y1+")-("+this.x2+", "+this.y2+")";};
/*
Polymorph method (expand rectangle to include given point or rectangle).
Also can call other instances of itself.
*/
Rectangle.prototype.add = polymorph(
        {x: Number, y: Number},
        function(x,y) {
                if(this.x1 > x) this.x1 = x;
                if(this.x2 < x) this.x2 = x;
                if(this.y1 > y) this.y1 = y;
                if(this.y2 < y) this.y2 = y;
        },

        {p: Point},
        function(p) {
                this.add(p.x, p.y);
        },

        {r: Rectangle},
        function(r) {
                this.add(r.x1, r.y1);
                this.add(r.x2, r.y2);
        }
);

/*
Test Rectangle and Point constructors
*/
new Rectangle(); // "(0, 0)-(0, 0)"
new Rectangle(3,5); // "(3, 5)-(3, 5)"
new Rectangle(new Point(), new Point(5,6)); // "(0, 0)-(5, 6)"
new Rectangle(3,5,6,7); // "(3, 5)-(6, 7)"

/*
Test Rectangle.add method
*/
var r = new Rectangle(); // "(0, 0)-(0, 0)"
r.add(2,2); // "(0, 0)-(2, 2)"
r.add(new Point(1,3)); // "(0, 0)-(2, 3)"
r.add(new Rectangle(1,2,3,4)); // "(0, 0)-(3, 4)"
You may find some more examples in polymorph-test.html.
```
