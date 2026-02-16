import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ProfitByZipTableProps {
  data: Array<[string, bigint]>;
}

export default function ProfitByZipTable({ data }: ProfitByZipTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No zip code data available
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Zip Code</TableHead>
          <TableHead className="text-right">Total Profit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(([zip, profit]) => (
          <TableRow key={zip}>
            <TableCell className="font-medium">{zip}</TableCell>
            <TableCell className="text-right">${Number(profit).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

