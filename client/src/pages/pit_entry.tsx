import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import { AspectRatio, Card, CardContent, Typography } from "@mui/joy";

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
          />
        </AspectRatio>
        <CardContent orientation="horizontal">
          <div>
            <Typography level="body-sm">EPA:</Typography>
            <Typography fontSize="lg" fontWeight="lg">
              100
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
          <Typography level="title-lg">4627 - Manning Robotics</Typography>
          <Typography level="body-sm">Amount of Breaks: 0</Typography>
        </div>
        <AspectRatio minHeight="120px" maxHeight="200px">
          <img
            src="https://hagadone.media.clients.ellingtoncms.com/ARTICLE_170429960_AR_0_WAMEMDNNOVJB_t1170.jpg?5cc718665ab672dba93d511ab4c682bb370e5f86"
          />
        </AspectRatio>
        <CardContent orientation="horizontal">
          <div>
            <Typography level="body-sm">EPA:</Typography>
            <Typography fontSize="lg" fontWeight="lg">
              90
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
