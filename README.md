# README
## PseudoCode

This extension provides language support for pseudocode files in CAIE standard, including language highlighting, keyword/variable hinting, document symbol listing, basic refactoring, error/warning/hint visualization, and several more.  

This is the extension side of the PseudoCode support. Code highlighting is supported without the PseudoCode package installed. To enable code hinting & execution, please install the PseudoCode package [here](https://gitee.com/williamcraft/pseudocode-releases/releases). This package includes executables for PseudoCode runtime (`PseudoCode.Cli`), Language Server Protocol (`PseudoCode.LSP`), and an updater (`PseudoCode.Update`), which once executed will download the latest PseudoCode package and extension and automatically install them.  

## Usage
The extension recognizes files that end with `.p` or `.pseudo` as PseudoCode files.  

Press `F5` to run `.pseudo` files, `F8` to update the vscode extension and pseudocode package.

You should use `<-` (Less than character `<` followed by a minus character `-`) instead of a real left arrow to represent assignment notation.

**Enjoy!**

## Differences to / Behaviors not specified in the standard

### File Operations

Binary (`RANDOM`) files are stored in [BSON](https://bsonspec.org/) using [Json.NET](http://json.net/). Every address corresponds to an instance which has variable size, in contrast with implementations in other languages whose address corresponds to one byte.

### Arrays

#### Multidimensional arrays are always flattened

This allows you to assign `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]` to an`ARRAY[1:3, 1:4] OF INTEGER`, for example.

#### Immediate arrays accept elements with different types but converts all to the type of the first element

This is an example:

```pseudocode
arbitraryArray <- [1, "123", TRUE] // ARRAY[1:3] OF INTEGER
arbitraryArray2 <- [1, "aspfijafpj", TRUE] // throws an error because the string cannot be converted to INTEGER.
```

#### Arrays can be assigned without declaration if not run with `-S` option.

I don't think this code will be allowed in standard but it's ok here:

```pseudocode
// No declaration
b <- [[1, 2, 3, 4],[5, 6, 7, 8], [9, 10, 11, 12]]
```

**However**, note that b is of type `ARRAY[1:12] OF INTEGER`, not `ARRAY[1:3, 1:4] OF INTEGER` because of array flattening.

**Another effect** of not declaring before assigning an array is the different behavior from the previous subsection:

```pseudocode
// We add a declaration statement, specifying the element type STRING
DECLARE arbitraryArray : ARRAY[1:3] OF STRING
// Every element is converted into INTEGER, then STRING
// since an immediate array converts all elements into the type of the first element
arbitraryArray <- [1, "2", FALSE] // arbitraryArray = ["1", "2", "0"]
OUTPUT arbitraryArray[3] & " Yes" // 0 Yes
```

### Functions / Procedures

#### Procedures = Functions with a return type of null

They're basically the same thing, just one with a return value and one without. This program treats them the same, so you can use `CALL`  and `BYREF` parameters on functions. (I mean why not lol)

### Errors

There are various types of errors that can be thrown:

#### InvalidAccessError

This is thrown when access operation is not valid (pretty literal):

+ Accessing arrays with non-integer(s)
+ Accessing arrays with more dimensions than the array's
+ Assigning an array to another with different total number of elements
+ Variable / Type member cannot be found in current scope
+ Unary / Binary operation not supported

#### InvalidTypeError

This is thrown when type check fails

+ Trying to call something that is not a function / procedure
+ Assigning non-array to an array
+ Passing a non-reference value to a function argument marked `BYREF`
+ Passing a value to a function argument marked `BYREF` with a different type

#### InvalidArgumentsError

This is thrown when calling a function with at least one argument that is not valid.

#### OutOfBoundsError

This is thrown when accessing an array with index greater than the upper bound or smaller than the lower bound.

#### UnsupportedCastError

This is thrown when a value cannot be casted to a specified type.

#### ReturnBreak

This is thrown when not using return inside a function.

#### Unhandled exception

This can be thrown when the PseudoCode runtime makes an error on itself, or something unexpected happens that breaks the runtime.

### Others

#### Values assigned to a variable is always casted, and values used as right operand is casted to the type of left operand except `INTEGER`

```pseudocode
DECLARE a : INTEGER
a <- TRUE // Allowed
a <- 1 + TRUE // Allowed, TRUE casted into INTEGER 1
a <- TRUE + 1 // UnsupportedCastError
a <- 1 + 1.2 // Allowed, 1 casted into REAL, Value 2.2 is casted into 2 and assigned to a
```

#### For loops accept expressions for variable increase

The following code is accepted

```pseudocode
DECLARE ForArray : ARRAY[1:10] OF INTEGER
FOR i <- 1 TO 10
    DECLARE Num : INTEGER
    OUTPUT i, ":"
    INPUT Num
    FOR ForArray[i] <- 1 TO Num
        OUTPUT ForArray[i]
    NEXT ForArray[i]
NEXT i
OUTPUT ForArray
```

In this example, `i` and `ForArray[i]` are used as variables for comparation. After the for-loop, their values will be the first value that is `Greater` than the target after incrementing by step, which defaults to 1(In this example the targets are `10` and `Num`).

#### Condition expression in Repeat-Until happens in inner scope

Declared variables inside repeat body can be used in `UNTIL`

The following code will be allowed (CAIE uses it anyways):

```pseudocode
REPEAT
    INPUT something
    OUTPUT something
UNTIL something = "YES" // Allowed
```
