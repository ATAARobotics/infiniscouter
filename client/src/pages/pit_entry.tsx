import { useState, useEffect } from "preact/hooks";
import { MatchEntryFields } from "../generated/MatchEntryFields";
import { MatchEntryPage } from "../generated/MatchEntryPage";
import { MatchEntry } from "../generated/MatchEntry";
import { AbilityMetric } from "../generated/AbilityMetric";
import { EnumMetric } from "../generated/EnumMetric";
import { BoolMetric } from "../generated/BoolMetric";
import { TimerMetric } from "../generated/TimerMetric";
import Button from "@mui/joy/Button";
import IconButton from "@mui/joy/IconButton";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import Box from "@mui/joy/Box";
import { MatchEntryData } from "src/generated/MatchEntryData";
import { MatchEntryValue } from "src/generated/MatchEntryValue";
import { AspectRatio, Card, CardContent, CircularProgress, Textarea, Typography, textareaClasses } from "@mui/joy";

// Pit Entry Page Component
export function PitEntry() {
  return (
    <Box>
      <Card sx={{ width: 320 }}>
        <div>
          <Typography level="title-lg">4421 - Forge Robotics</Typography>
          <Typography level="body-sm">Amount of Breaks: 0</Typography>
        </div>
        <AspectRatio minHeight="120px" maxHeight="200px">
          <img
            src="https://i.ytimg.com/vi/pXpfVwNjV7Q/maxresdefault.jpg"
            loading="lazy"
          />
        </AspectRatio>
        <CardContent orientation="horizontal">
          <div>
            <Typography level="body-xs">EPA:</Typography>
            <Typography fontSize="lg" fontWeight="lg">
              100000
            </Typography>
          </div>
          <Button
            variant="solid"
            size="md"
            color="primary"
            aria-label="View team"
            sx={{ ml: 'auto', alignSelf: 'center', fontWeight: 600 }}
          >
            View
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ width: 320 }}>
        <div>
          <Typography level="title-lg">4421 - Forge Robotics</Typography>
          <Typography level="body-sm">Amount of Breaks: 0</Typography>
        </div>
        <AspectRatio minHeight="120px" maxHeight="200px">
          <img
            src="https://i.ytimg.com/vi/pXpfVwNjV7Q/maxresdefault.jpg"
            loading="lazy"
          />
        </AspectRatio>
        <CardContent orientation="horizontal">
          <div>
            <Typography level="body-xs">EPA:</Typography>
            <Typography fontSize="lg" fontWeight="lg">
              100000
            </Typography>
          </div>
          <Button
            variant="solid"
            size="md"
            color="primary"
            aria-label="View team"
            sx={{ ml: 'auto', alignSelf: 'center', fontWeight: 600 }}
          >
            View
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
