import CheckIcon from "@mui/icons-material/Check";
import Box from "@mui/joy/Box";
import { TeamInfoList } from "../generated/TeamInfoList";
import { useEffect, useState } from "preact/compat";
import { Checkbox, Chip, Stack, Table } from "@mui/joy";
import { DataValue } from "src/components/data_value";

// Analysis Page Component
export function Analysis() {
  const [table, setTable] = useState<TeamInfoList>();
  const [enabledColumns, setEnabledColumns] = useState<number[]>([0]);
  useEffect(() => {
    // TODO: Fetch in the sync and store in local storage.
    fetch("/api/analysis/list")
      .then((response) => response.json())
      .then((data2) => {
        setTable(data2);
      });
  }, []);

  if (table === undefined) {
    return <div>:( (loading...)</div>;
  }

  return (
    <Box>
      <Stack direction="row">
        {table.names.map((column, idx) => {
          const checked = enabledColumns.includes(idx);
          return (
            <Chip
              key={idx}
              variant="plain"
              color={checked ? "primary" : "neutral"}
              startDecorator={checked && <span>✓</span>}
            >
              <Checkbox
                variant="outlined"
                color={checked ? "primary" : "neutral"}
                disableIcon
                overlay
                label={column}
                checked={checked}
                onChange={(ev: InputEvent) => {
                  setEnabledColumns(
                    !((ev.target as HTMLInputElement).checked as boolean)
                      ? enabledColumns.filter((n) => n !== idx)
                      : [...enabledColumns, idx],
                  );
                }}
              />
            </Chip>
          );
        })}
      </Stack>
      <Table hoverRow borderAxis="y" stripe="even">
        <caption>Data Output</caption>
        <thead>
          {table.names
            .filter((_, idx) => enabledColumns.includes(idx))
            .map((title) => (
              <th style={{ width: "50px" }}>{title}</th>
            ))}
        </thead>
        <tbody>
          {table.list.map((row) => (
            <tr style={{ height: "50px" }}>
              {row.info
                .filter((_, idx) => enabledColumns.includes(idx))
                .map((val) => (
                  <DataValue value={val} />
                ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
}
