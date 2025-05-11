      {/* Team Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTeam && (
            <>
              <DialogHeader className="bg-gradient-to-r from-primary/20 to-primary/5 px-2 py-4 -mx-6 -mt-6 mb-6 border-b sticky top-[-24px] z-10">
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  <DialogTitle className="text-xl font-bold">{selectedTeam.name}</DialogTitle>
                </div>
                <DialogDescription className="text-muted-foreground">
                  {selectedTeam.event?.name || 'Registration Details'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2">
                {/* Team Info Card */}
                <div className="bg-card rounded-lg shadow-sm border p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    Team Information
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Status
                      </span>
                      <div>
                        <Badge className="font-medium" variant={
                          selectedTeam.status === 'approved' ? 'success' : 
                          selectedTeam.status === 'rejected' ? 'destructive' : 
                          selectedTeam.status === 'waitlisted' ? 'warning' :
                          'default'
                        }>
                          {selectedTeam.status?.toUpperCase() || 'REGISTERED'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Age Group
                      </span>
                      <div className="font-medium">{selectedTeam.ageGroup?.ageGroup || 'N/A'}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Club
                      </span>
                      <div className="font-medium">{selectedTeam.clubName || 'N/A'}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Registration Date
                      </span>
                      <div className="font-medium">{formatDate(selectedTeam.createdAt)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Info Card */}
                <div className="bg-card rounded-lg shadow-sm border p-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Contact Information
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Manager
                      </span>
                      <div className="font-medium">{selectedTeam.managerName || 'N/A'}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </span>
                      <div className="font-medium">{selectedTeam.managerEmail || 'N/A'}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </span>
                      <div className="font-medium">{selectedTeam.managerPhone || 'N/A'}</div>
                    </div>
                    
                    {selectedTeam.coachData?.headCoachName && (
                      <div className="flex justify-between items-center py-1.5 border-b">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <UserCircle className="h-4 w-4" />
                          Coach
                        </span>
                        <div className="font-medium">{selectedTeam.coachData.headCoachName}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Payment Info Card */}
              <div className="bg-card rounded-lg shadow-sm border p-4 mt-6 mx-2">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Registration Fee
                      </span>
                      <div className="font-medium">{formatCurrency(selectedTeam.registrationFee || 0)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Status
                      </span>
                      <div>
                        <Badge 
                          className="font-medium" 
                          variant={
                            selectedTeam.paymentStatus === 'paid' ? 'success' : 
                            selectedTeam.paymentStatus === 'refunded' ? 'outline' : 
                            'outline'
                          }
                        >
                          {selectedTeam.paymentStatus || 'Unpaid'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedTeam.cardLast4 && (
                      <div className="flex justify-between items-center py-1.5 border-b">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Card
                        </span>
                        <div className="font-medium">•••• {selectedTeam.cardLast4}</div>
                      </div>
                    )}
                    
                    {selectedTeam.paymentIntentId && (
                      <div className="flex justify-between items-center py-1.5 border-b">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          Transaction ID
                        </span>
                        <div className="font-medium">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {selectedTeam.paymentIntentId.substring(0, 10)}...
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Roster Section */}
              <div className="bg-card rounded-lg shadow-sm border p-4 mt-6 mx-2">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Team Roster
                </h3>
                
                {selectedTeam.players && selectedTeam.players.length > 0 ? (
                  <div className="overflow-hidden border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Date of Birth</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTeam.players.map((player, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{player.firstName} {player.lastName}</TableCell>
                            <TableCell>{formatDate(player.dateOfBirth)}</TableCell>
                            <TableCell>{player.position || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  setSelectedPlayer(player);
                                  setIsAddPlayerMode(false);
                                  setIsPlayerDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-md bg-muted/10">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium mb-1">No Players Added</h3>
                    <p className="text-muted-foreground mb-4">This team doesn't have any players added yet.</p>
                    <Button 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => {
                        setSelectedTeamId(selectedTeam.id);
                        setIsAddPlayerMode(true);
                        setIsPlayerDialogOpen(true);
                      }}
                    >
                      <PlusCircle className="mr-1 h-4 w-4" />
                      Add First Player
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end mt-6 pt-4 border-t mx-2">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>