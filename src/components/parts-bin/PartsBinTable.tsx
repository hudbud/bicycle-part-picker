import type { BinItem } from '@/store/partsBinStore'
import { PartsBinRow } from './PartsBinRow'

interface PartsBinTableProps {
  items: BinItem[]
}

export function PartsBinTable({ items }: PartsBinTableProps) {
  return (
    <div className="border border-border-default rounded-lg overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border-strong bg-bg-surface">
            <th scope="col" className="table-header px-4 py-2.5 text-left">Part</th>
            <th scope="col" className="table-header px-4 py-2.5 text-left w-32">Category</th>
            <th scope="col" className="table-header px-4 py-2.5 text-left w-24">Price</th>
            <th scope="col" className="table-header px-4 py-2.5 text-left w-32">Status</th>
            <th scope="col" className="table-header px-4 py-2.5 text-left">Notes</th>
            <th scope="col" className="table-header px-4 py-2.5 w-28"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <PartsBinRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
