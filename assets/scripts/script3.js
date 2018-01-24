var count = 0;
continuously(function() {
    me.spells.fire.fireball(me.x, me.y).shove(me.focus.x - me.x, me.focus.y - me.y);
    return count++ < 21;
});