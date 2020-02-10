//
// treeIndex.js
//
//   This file implements the index mangement functions for the tree.
//   Including:
//
//      treeReIndex - re-indexes the given tree, referenced by path - ex. 2021/2468/ElPaso
//      treeIndex - returns the given index in JSON, referenced by path
//      treeIndexcheck - checks the given index, refrenced by path
//

var INDEX = '_index';
var FULLINDEX = '_fullindex';

//
// isSpecialNode() - return true if the given node (as a string) is special
//
function isSpecialNode(nodeString)
{
    return(nodeString[0] == '_');
}

//
// treeIndex() - given a ref for the location of the target (sub)tree,
//               returns a PROMISE that will eventually return an object
//               that contains the segment of the index requested.
//
//               { child1:{...}, child2:{...}, child3:{...} }
//
//               The leaves will have an empty object for their value
//               (no children).
//
//      BIG NOTE - in the FOR loop below, a "let" is used as opposed to
//          a "var". This is because "var" is in the scope of the function
//          but "let" is the scope of the for loop. This means that when the
//          promise code within the for loop is executed, the value of
//          child is as it was at the time of that loop...as opposed to being
//          the value of the last loop.
//
function treeIndexRecursive(ref)
{
    return(
	ref.child(INDEX)
	    .once("value")
	    .then((snapshot) => {
		let pchain = Promise.resolve({});
		for(let child in snapshot.val()) {
		    pchain = pchain.then((retObj) => treeIndexRecursive(ref.child(child))
					 .then((obj) => { retObj[child] = obj; return(retObj); }));
		}
		return(pchain);
	    }));
}

//
// rebuildIndex() - rebuilds the entire index for the storage tree.
//                  It KNOWS that it is a four level tree, and no
//                  index is built at the match level.  The root is
//                  a ref to the root of the tree.  Returns the
//                  promise used to do the whole thing.
//
function rebuildIndex(root,timestamp)
{
    // this gets the WHOLE tree - yikes

    return(
	root.once("value")
            .then((snapshot) => {
		data = snapshot.val();
		root.child(INDEX).remove();
		root.child(FULLINDEX).remove();
		for(var year in data) {
		    if(!isSpecialNode(year)) {
			root.child(INDEX).child(year).set(timestamp);
			root.child(year).child(INDEX).remove();
			root.child(year).child(FULLINDEX).remove();
			for(var robot in data[year]) {
			    if(!isSpecialNode(robot)) {
				root.child(year).child(INDEX).child(robot).set(timestamp);
				root.child(year).child(robot).child(INDEX).remove();
				root.child(year).child(robot).child(FULLINDEX).remove();
				for(var competition in data[year][robot]) {
				    if(!isSpecialNode(competition)) {
					root.child(year).child(robot).child(INDEX).child(competition).set(timestamp);
					root.child(year).child(robot).child(competition).child(INDEX).remove();
					root.child(year).child(robot).child(competition).child(FULLINDEX).remove();
					for(var match in data[year][robot][competition]) {
					    if(!isSpecialNode(match)) {
						root.child(year).child(robot).child(competition).child(INDEX).child(match).set(timestamp);
						root.child(FULLINDEX).child(year).child(robot).child(competition).child(match).set(timestamp);
						root.child(year).child(FULLINDEX).child(robot).child(competition).child(match).set(timestamp);
						root.child(year).child(robot).child(FULLINDEX).child(competition).child(match).set(timestamp);
						root.child(year).child(robot).child(competition).child(FULLINDEX).child(match).set(timestamp);
					    }
					}
				    }
				}
			    }
			}
		    }
		}
	    }));
}

//
// upperIndexUpdate() - update FULLINDEX/INDEX for the tree for the location
//                      specified.  The INDEX is a single-level enumeration of
//                      the children at that level. The FULLINDEX is the whole
//                      tree index starting at that level. Each leaf in both
//                      indicies has a timestamp for when that node was updated.
//          RETURNS - the promise that does the whole update.
//
function upperIndexUpdate(root,year,robot,competition,match,timestamp)
{
    return(

	// update the full index
	root.child(FULLINDEX).child(year).child(robot).child(competition).child(match).set(timestamp)
            .then(_ => root.child(year).child(FULLINDEX).child(robot).child(competition).child(match).set(timestamp))
            .then(_ => root.child(year).child(robot).child(FULLINDEX).child(competition).child(match).set(timestamp))
            .then(_ => root.child(year).child(robot).child(competition).child(FULLINDEX).child(match).set(timestamp))

	// update the level index
            .then(_ => root.child(INDEX).child(year).set(timestamp))
            .then(_ => root.child(year).child(INDEX).child(robot).set(timestamp))
            .then(_ => root.child(year).child(robot).child(INDEX).child(competition).set(timestamp))
            .then(_ => root.child(year).child(robot).child(competition).child(INDEX).child(match).set(timestamp))
    );
}
    

module.exports = {
    treeIndexRecursive: treeIndexRecursive,
    upperIndexUpdate: upperIndexUpdate,
    rebuildIndex: rebuildIndex
};
