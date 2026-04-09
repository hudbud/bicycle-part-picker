import type { BinItem } from '@/store/partsBinStore'
import { PartsBinRow } from './PartsBinRow'
import { Table, TableBody, TableHead, TableRow, TableHeadCell } from 'react95'

interface PartsBinTableProps {
  items: BinItem[]
}

export function PartsBinTable({ items }: PartsBinTableProps) {
  return (
    <Table style={{ width: '100%' }}>
      <TableHead>
        <TableRow>
          <TableHeadCell>Part</TableHeadCell>
          <TableHeadCell style={{ width: 120 }}>Category</TableHeadCell>
          <TableHeadCell style={{ width: 90 }}>Price</TableHeadCell>
          <TableHeadCell style={{ width: 120 }}>Status</TableHeadCell>
          <TableHeadCell>Notes</TableHeadCell>
          <TableHeadCell style={{ width: 110 }}></TableHeadCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((item) => (
          <PartsBinRow key={item.id} item={item} />
        ))}
      </TableBody>
    </Table>
  )
}
