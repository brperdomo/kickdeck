// Previous code remains unchanged

                                  <TableRow key={field.id}>
                                    <TableCell>{field.name}</TableCell>
                                    <TableCell>
                                      <Badge variant={field.isOpen ? "default" : "secondary"}>
                                        {field.isOpen ? 'Open' : 'Closed'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-2">
                                        {field.hasLights && (
                                          <Badge variant="outline">Lights</Badge>
                                        )}
                                        {field.hasParking && (
                                          <Badge variant="outline">Parking</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>{field.specialInstructions || 'None'}</TableCell>
                                  </TableRow>

// Rest of the file remains unchanged
