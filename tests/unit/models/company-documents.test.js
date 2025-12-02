import mongoose from "mongoose";
import Company from "../../../src/models/Company.js";

describe("Company Model - Documents Schema", () => {
  beforeAll(async () => {
    // Connect to test database only if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/test", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test("should accept additionalDocuments array in documents schema", () => {
    const companyData = {
      companyId: "TEST-001",
      firebaseUid: "test-uid-001",
      companyName: "Test Company",
      website: "https://test.com",
      email: "test@test.com",
      phone: "9876543210",
      address: "Test Address",
      documents: {
        cinNumber: "CIN123456",
        gstCertificate: "https://s3.amazonaws.com/gst.pdf",
        registrationCertificate: "https://s3.amazonaws.com/reg.pdf",
        addressProof: "https://s3.amazonaws.com/address.pdf",
        additionalDocuments: [
          {
            id: "doc-1",
            label: "Tax Certificate",
            url: "https://s3.amazonaws.com/tax.pdf",
            uploadedAt: new Date()
          },
          {
            id: "doc-2",
            label: "Business License",
            url: "https://s3.amazonaws.com/license.pdf",
            uploadedAt: new Date()
          }
        ]
      },
      pointOfContact: {
        name: "John Doe",
        email: "john@test.com",
        phone: "9876543210"
      }
    };

    const company = new Company(companyData);
    const validationError = company.validateSync();
    
    expect(validationError).toBeUndefined();
    expect(company.documents.additionalDocuments).toHaveLength(2);
    expect(company.documents.additionalDocuments[0].label).toBe("Tax Certificate");
  });

  test("should allow empty additionalDocuments array", () => {
    const companyData = {
      companyId: "TEST-002",
      firebaseUid: "test-uid-002",
      companyName: "Test Company 2",
      website: "https://test2.com",
      email: "test2@test.com",
      phone: "9876543211",
      address: "Test Address 2",
      documents: {
        cinNumber: "CIN123457",
        additionalDocuments: []
      },
      pointOfContact: {
        name: "Jane Doe",
        email: "jane@test.com",
        phone: "9876543211"
      }
    };

    const company = new Company(companyData);
    const validationError = company.validateSync();
    
    expect(validationError).toBeUndefined();
    expect(company.documents.additionalDocuments).toHaveLength(0);
  });

  test("should allow documents without additionalDocuments field", () => {
    const companyData = {
      companyId: "TEST-003",
      firebaseUid: "test-uid-003",
      companyName: "Test Company 3",
      website: "https://test3.com",
      email: "test3@test.com",
      phone: "9876543212",
      address: "Test Address 3",
      documents: {
        cinNumber: "CIN123458",
        gstCertificate: "https://s3.amazonaws.com/gst.pdf"
      },
      pointOfContact: {
        name: "Bob Smith",
        email: "bob@test.com",
        phone: "9876543212"
      }
    };

    const company = new Company(companyData);
    const validationError = company.validateSync();
    
    expect(validationError).toBeUndefined();
  });
});
