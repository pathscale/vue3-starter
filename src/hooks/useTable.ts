import type { Ref } from 'vue'
import { onMounted, ref, toRaw, watch, watchEffect } from 'vue'
import DataGrid from '~/components/DataGrid'

interface IColumn {
  key: string
  label: string
  type: string
}

const useTable = <T extends Record<string, any>>(
  data: Ref<T | undefined>,
  key: keyof T,
  columns: IColumn[],
) => {
  const datagrid = ref(new DataGrid())

  const generateColumns = (sortBy?: string, ascendant?: boolean) => {
    columns.forEach(column =>
      datagrid.value.addColumn(
        column.key,
        column.label,
        column.type,
        sortBy === column.key && (!ascendant || false),
      ),
    )
  }

  generateColumns()

  const populateTable = () => {
    if (data?.value?.[key]) {
      const sortBy = datagrid.value.sortBy
      const sortAscendant = datagrid.value.sortAscendant
      datagrid.value = new DataGrid()
      generateColumns(sortBy, sortAscendant)
      data?.value[key].forEach((row: any) => {
        datagrid.value.addRow(row)
      })

      if (sortBy) {
        datagrid.value.sortByColumn(sortBy, sortAscendant)
      }
    }
  }

  onMounted(() => {
    populateTable()
  })

  watch([() => data?.value?.[key]], () => {
    populateTable()
  })

  return datagrid as unknown as Ref<typeof DataGrid>
}

export default useTable
