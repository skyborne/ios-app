//
//  CoreDataStack.swift
//  Skyborne
//
//  Created by Dominic Philip on 5/9/17.
//  Copyright © 2017 Skyborne Co. All rights reserved.
//

import CoreData

class CoreDataStack {

    // MARK: - Core Data Stack
    
    static var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "DataModel")
        container.loadPersistentStores(completionHandler: { (storeDescription, error) in
            if let error = error as NSError? {
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        })
        return container
    }()
    
    // MARK: - Core Data Saving Support
    
    static func saveContext() {
        let context = persistentContainer.viewContext
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let error = error as NSError
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }
    }

}
