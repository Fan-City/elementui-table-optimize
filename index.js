function randomString(len) {
    len = len || 10
    var chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
    var maxPos = chars.length
    var str = ''
    for (i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * maxPos))
    }
    return str
}

const tableData2 = []
for (let i = 0; i < 100; i++) {
    let row = {
        id: i,
        checked: false,
    }
    for(let j=0;j<40;j++){
        row['col'+j] =randomString(4) 
    }
    tableData2.push(row)
}
const tableData3 = []
for (let i = 0; i < 100; i++) {
     let row = {
        id: i,
    }
    for(let j=0;j<40;j++){
        row['col'+j] =randomString(4) 
    }
    tableData3.push(row)
}
var Main = {
    data() {
        return {
            tableData2: tableData2,
            tableData3: tableData3
        }
    },

    methods: {
        toggleSelection2(rowsIndex) {
            if (rowsIndex) {
                rowsIndex.forEach(rowsIndex => {
                    let rowData = tableData2[rowsIndex]
                    rowData.checked = !rowData.checked
                    tableData2.splice(rowsIndex, 1, rowData)
                })
            }
        },
        toggleSelection3(rows) {
            if (rows) {
                rows.forEach(row => {
                    this.$refs.multipleTable3.toggleRowSelection(row)
                })
            } else {
                this.$refs.multipleTable3.clearSelection()
            }
        },
        renderCheckbox(_c, data) {
            console.log(data)
            let that = this
            return _c('label', [
                _c('input', {
                    attrs: { 'type': 'checkbox' },
                    on: { 'click': that.toggleAllSelection }
                }), '全选'
            ])
        },
        toggleAllSelection(e) {
            let checked = e.target.checked
            console.log(checked, this)
            for (let i = 0, len=this.tableData2.length; i < len; i++){
                this.tableData2[i].checked = checked
            }
            this.$set(this, 'tableData2', this.tableData2)
        }
    }
}
var Ctor = Vue.extend(Main)
new Ctor().$mount('#app')
