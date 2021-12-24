export default {
    props:['deleteMessage'],
    data:{

    },
    /* 批量删除选中的通话记录 */
    deleteCheckedCalls() {
        this.$element('deleteCheckDialog').show(); //显示删除提示框
    },
    /* 确认删除 */
    doDelete() {
        this.$emit('sureProcess',{});
        this.$element('deleteCheckDialog').close();
    },
    /* 取消删除 */
    cancelDialog() {
        this.$element('deleteCheckDialog').close();
    },

}