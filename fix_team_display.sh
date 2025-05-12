#!/bin/bash

# First, fix all getCoachName instances to getRosterCount
sed -i 's/<TableCell>{getCoachName(team.coach)}<\/TableCell>/<TableCell>{getRosterCount(team)}<\/TableCell>/g' client/src/pages/admin-dashboard.tsx

# Next, fix all managerEmail instances to show createdAt date
sed -i 's/<TableCell>{team\.managerEmail}<\/TableCell>/<TableCell>{formatDate(team.createdAt)}<\/TableCell>/g' client/src/pages/admin-dashboard.tsx

# Finally, fix the payment display to use the getPaymentMethodDisplay function
sed -i 's/<Badge variant={team.paymentStatus === '\''paid'\'' ? '\''default'\'' : '\''outline'\''}>\n                                    {team.paymentStatus || '\''Unpaid'\''}\n                                  <\/Badge>/{getPaymentMethodDisplay(team)}/g' client/src/pages/admin-dashboard.tsx
