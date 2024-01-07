import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import { TeamInfoList } from "../generated/TeamInfoList";
import { useEffect, useState } from "preact/compat";
import { Table } from "@mui/joy";
import { DataValue } from "src/components/data_value";

// Analysis Page Component
export function Analysis() {
  const [table, setTable] = useState<TeamInfoList>();
  useEffect(() => {
    // TODO: Fetch in the sync and store in local storage.
    fetch("/api/analysis/list")
      .then((response) => response.json())
      .then((data2) => {
        setTable(data2);
      });
  }, []);
  console.log(table);

  if (table === undefined) {
    return <div>:(</div>;
  }

  return (
    <Box>
      <Table stripe="even">
        <caption>Data Output</caption>
        <thead>
          {table.names.map(title => (
            <th style={{width: "50px"}}>{title}</th>
          ))}
        </thead>
        <tbody>
          {table.list.map((row) => (
            <tr style={{height: "50px"}}>
              {row.info.map((val) => (
                <DataValue value={val} />
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
}
